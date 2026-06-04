package com.nilaapps.adaptive.repository;

import com.nilaapps.adaptive.model.ComponentItem;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class ComponentRepository {

    private final List<ComponentItem> store = new ArrayList<>();

    public ComponentRepository() {
        init();
    }

    private void init() {
        store.add(new ComponentItem(
            "cmp-assess-math-1", "Math Module 1 Assessment",
            "Baseline math diagnostic used to route learners.",
            "assessment", 35,
            Map.of("assessment", Map.of("maxScore", 100, "passingScore", 50))
        ));
        store.add(new ComponentItem(
            "cmp-unit-math-2-easy", "Math Module 2 - Easy",
            "Foundational math remediation unit.",
            "unit", 35,
            Map.of("unit", Map.of("recommendedMinutes", 30))
        ));
        store.add(new ComponentItem(
            "cmp-unit-math-2-advanced", "Math Module 2 - Advanced",
            "Advanced math enrichment unit for high scorers.",
            "unit", 35,
            Map.of("unit", Map.of("recommendedMinutes", 35))
        ));
        store.add(new ComponentItem(
            "cmp-assess-reading-1", "Reading & Comp Module 1",
            "Baseline reading comprehension diagnostic.",
            "assessment", 32,
            Map.of("assessment", Map.of("maxScore", 100, "passingScore", 60))
        ));
        store.add(new ComponentItem(
            "cmp-unit-reading-2-easy", "R&C Module 2 - Easy",
            "Foundational reading comprehension remediation.",
            "unit", 32,
            Map.of("unit", Map.of("recommendedMinutes", 30))
        ));
        store.add(new ComponentItem(
            "cmp-unit-reading-2-advanced", "R&C Module 2 - Advanced",
            "Advanced reading comprehension enrichment.",
            "unit", 32,
            Map.of("unit", Map.of("recommendedMinutes", 32))
        ));
    }

    public List<ComponentItem> findAll() {
        return Collections.unmodifiableList(store);
    }

    public int count() {
        return store.size();
    }

    public Optional<ComponentItem> findById(String id) {
        return store.stream().filter(c -> c.getId().equals(id)).findFirst();
    }
}
