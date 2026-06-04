package com.nilaapps.adaptive.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PathNode {
    @NotBlank @Size(max = 100)
    private String id;

    @NotBlank @Size(max = 100)
    private String componentId;

    // CHANGED: SC-4 / BL-5 — enum constraint replaces open string
    @NotBlank
    @Pattern(regexp = "^(start|unit|assessment|end|group)$", message = "type must be start|unit|assessment|end|group")
    private String type;

    @NotBlank @Size(max = 150)
    private String label;

    @Size(max = 1000)
    private String description;
    private Map<String, Object> position;
    private Map<String, Object> config;

    public PathNode() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getComponentId() { return componentId; }
    public void setComponentId(String componentId) { this.componentId = componentId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Map<String, Object> getPosition() { return position; }
    public void setPosition(Map<String, Object> position) { this.position = position; }
    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }
}
