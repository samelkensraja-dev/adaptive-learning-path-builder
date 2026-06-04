package com.nilaapps.adaptive.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class LearningPath {
    private String id;

    @NotBlank
    @Size(min = 1, max = 150, message = "name must be 1–150 characters")
    private String name;

    @Size(max = 1000, message = "description must not exceed 1000 characters")
    private String description;

    @NotNull
    @Pattern(regexp = "^(draft|published)$", message = "status must be 'draft' or 'published'")
    private String status;
    private Integer version;
    private Map<String, Object> canvas;

    @NotNull
    private List<PathNode> nodes;

    @NotNull
    private List<PathEdge> edges;

    public LearningPath() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Map<String, Object> getCanvas() { return canvas; }
    public void setCanvas(Map<String, Object> canvas) { this.canvas = canvas; }
    public List<PathNode> getNodes() { return nodes; }
    public void setNodes(List<PathNode> nodes) { this.nodes = nodes; }
    public List<PathEdge> getEdges() { return edges; }
    public void setEdges(List<PathEdge> edges) { this.edges = edges; }
}
