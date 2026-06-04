package com.nilaapps.adaptive.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ComponentItem {
    private String id;
    private String title;
    private String shortDescription;
    private String type; // "unit" | "assessment"
    private int approximateDurationMinutes;
    private Map<String, Object> metadata;

    public ComponentItem() {}

    public ComponentItem(String id, String title, String shortDescription,
                         String type, int approximateDurationMinutes, Map<String, Object> metadata) {
        this.id = id;
        this.title = title;
        this.shortDescription = shortDescription;
        this.type = type;
        this.approximateDurationMinutes = approximateDurationMinutes;
        this.metadata = metadata;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getApproximateDurationMinutes() { return approximateDurationMinutes; }
    public void setApproximateDurationMinutes(int v) { this.approximateDurationMinutes = v; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
