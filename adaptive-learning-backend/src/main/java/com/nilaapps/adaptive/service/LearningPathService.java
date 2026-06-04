package com.nilaapps.adaptive.service;

import com.nilaapps.adaptive.model.*;
import com.nilaapps.adaptive.repository.LearningPathRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class LearningPathService {

    // CHANGED: B-08 — audit logger for all write operations
    private static final Logger audit = LoggerFactory.getLogger("AUDIT." + LearningPathService.class.getName());

    private final LearningPathRepository repository;

    public LearningPathService(LearningPathRepository repository) {
        this.repository = repository;
        seedExample();
    }

    private void seedExample() {
        LearningPath lp = new LearningPath();
        lp.setId("lp-sat-adaptive-001");
        lp.setName("SAT Adaptive Path");
        lp.setDescription("Routes learners based on math and reading performance.");
        lp.setStatus("draft");
        lp.setVersion(1);
        lp.setCanvas(Map.of("zoom", 0.7, "offsetX", 0, "offsetY", 0));
        lp.setNodes(buildSeedNodes());
        lp.setEdges(buildSeedEdges());
        repository.save(lp);
    }

    public List<LearningPath> findAll() {
        return repository.findAll();
    }

    public Optional<LearningPath> findById(String id) {
        return repository.findById(id);
    }

    public LearningPath create(LearningPath lp) {
        if (lp.getVersion() == null) lp.setVersion(1);
        LearningPath saved = repository.save(lp);
        audit.info("CREATED learning-path id={} name=\"{}\"", saved.getId(), saved.getName()); // B-08
        return saved;
    }

    public Optional<LearningPath> update(String id, LearningPath lp) {
        if (!repository.existsById(id)) return Optional.empty();
        lp.setId(id);
        // CHANGED: B-09 race-condition — increment version inside repository lock
        return repository.findById(id).map(existing -> {
            lp.setVersion(existing.getVersion() != null ? existing.getVersion() + 1 : 1);
            LearningPath saved = repository.save(lp);
            audit.info("UPDATED learning-path id={} version={}", saved.getId(), saved.getVersion()); // B-08
            return saved;
        });
    }

    public boolean delete(String id) {
        boolean removed = repository.deleteById(id);
        if (removed) audit.info("DELETED learning-path id={}", id); // B-08
        return removed;
    }

    // ── Seed data helpers ────────────────────────────────────────────────────

    private List<PathNode> buildSeedNodes() {
        List<PathNode> nodes = new ArrayList<>();
        nodes.add(node("node-start",          "system-start",               "start",      "Start Assessment",          pos(420,60),  null));
        nodes.add(node("node-math-1",          "cmp-assess-math-1",          "assessment", "Math Module 1",             pos(420,170), cfg(35, Map.of("maxScore",100,"passingScore",50))));
        nodes.add(node("node-math-2-group",    "system-group",               "group",      "Math Module 2",             pos(360,280), null));
        nodes.add(node("node-math-2-easy",     "cmp-unit-math-2-easy",       "unit",       "Math Module 2 - Easy",      pos(230,380), cfg(35, null)));
        nodes.add(node("node-math-2-advanced", "cmp-unit-math-2-advanced",   "unit",       "Math Module 2 - Advanced",  pos(490,380), cfg(35, null)));
        nodes.add(node("node-reading-1",       "cmp-assess-reading-1",       "assessment", "Reading & Comp Module 1",   pos(420,510), cfg(32, Map.of("maxScore",100,"passingScore",60))));
        nodes.add(node("node-reading-2-group", "system-group",               "group",      "Reading & Comp Module 2",   pos(360,620), null));
        nodes.add(node("node-reading-2-easy",  "cmp-unit-reading-2-easy",    "unit",       "R&C Module 2 - Easy",       pos(230,720), cfg(32, null)));
        nodes.add(node("node-reading-2-adv",   "cmp-unit-reading-2-advanced","unit",       "R&C Module 2 - Advanced",   pos(490,720), cfg(32, null)));
        nodes.add(node("node-end",             "system-end",                 "end",        "Complete Assessment",       pos(420,850), null));
        return nodes;
    }

    private List<PathEdge> buildSeedEdges() {
        return List.of(
            edge("e1",  "node-start",          "node-math-1",          null,           1, true,  empty()),
            edge("e2",  "node-math-1",         "node-math-2-group",    null,           1, true,  empty()),
            edge("e3",  "node-math-2-group",   "node-math-2-easy",     "Score < 50%",  1, false, scoreRange("node-math-1",0,49)),
            edge("e4",  "node-math-2-group",   "node-math-2-advanced", "Passed",       2, true,  passed("node-math-1")),
            edge("e5",  "node-math-2-easy",    "node-reading-1",       null,           1, true,  empty()),
            edge("e6",  "node-math-2-advanced","node-reading-1",       null,           1, true,  empty()),
            edge("e7",  "node-reading-1",      "node-reading-2-group", null,           1, true,  empty()),
            edge("e8",  "node-reading-2-group","node-reading-2-easy",  "Score < 60%",  1, false, scoreRange("node-reading-1",0,59)),
            edge("e9",  "node-reading-2-group","node-reading-2-adv",   "Passed",       2, true,  passed("node-reading-1")),
            edge("e10", "node-reading-2-easy", "node-end",             null,           1, true,  empty()),
            edge("e11", "node-reading-2-adv",  "node-end",             null,           1, true,  empty())
        );
    }

    private PathNode node(String id, String cid, String type, String label,
                          Map<String,Object> pos, Map<String,Object> cfg) {
        PathNode n = new PathNode();
        n.setId(id); n.setComponentId(cid); n.setType(type);
        n.setLabel(label); n.setPosition(pos); n.setConfig(cfg);
        return n;
    }

    private PathEdge edge(String id, String src, String tgt, String label,
                          int priority, boolean isDefault, Map<String,Object> conditions) {
        PathEdge e = new PathEdge();
        e.setId(id); e.setSourceNodeId(src); e.setTargetNodeId(tgt);
        e.setLabel(label); e.setPriority(priority); e.setIsDefault(isDefault);
        e.setConditions(conditions);
        return e;
    }

    private Map<String,Object> pos(int x, int y)          { return Map.of("x", x, "y", y); }
    private Map<String,Object> cfg(int mins, Map<String,Object> assessment) {
        Map<String,Object> c = new java.util.HashMap<>();
        c.put("approximateDurationMinutes", mins);
        if (assessment != null) c.put("assessment", assessment);
        return c;
    }
    private Map<String,Object> empty()                    { return Map.of("operator","AND","rules",List.of()); }
    private Map<String,Object> passed(String nodeId) {
        return Map.of("operator","AND","rules",List.of(
            Map.of("id","r-"+nodeId+"-passed","sourceType","assessment",
                   "sourceNodeId",nodeId,"metric","passed","operator","eq","value",true)));
    }
    private Map<String,Object> scoreRange(String nodeId, int min, int max) {
        return Map.of("operator","AND","rules",List.of(
            Map.of("id","r-"+nodeId+"-c","sourceType","assessment",
                   "sourceNodeId",nodeId,"metric","completion","operator","eq","value",true),
            Map.of("id","r-"+nodeId+"-r","sourceType","assessment",
                   "sourceNodeId",nodeId,"metric","score_range","operator","between",
                   "range",Map.of("min",min,"max",max,"minInclusive",true,"maxInclusive",true))));
    }
}
