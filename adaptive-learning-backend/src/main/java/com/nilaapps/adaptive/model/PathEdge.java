package com.nilaapps.adaptive.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PathEdge {
    private String id;
    private String sourceNodeId;
    private String targetNodeId;
    private String label;
    private Integer priority;
    private Boolean isDefault;
    private Map<String, Object> conditions;

    public PathEdge() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSourceNodeId() { return sourceNodeId; }
    public void setSourceNodeId(String sourceNodeId) { this.sourceNodeId = sourceNodeId; }
    public String getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(String targetNodeId) { this.targetNodeId = targetNodeId; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public Map<String, Object> getConditions() { return conditions; }
    public void setConditions(Map<String, Object> conditions) { this.conditions = conditions; }
}
