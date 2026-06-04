package com.nilaapps.adaptive.service;

import com.nilaapps.adaptive.model.ComponentItem;
import com.nilaapps.adaptive.repository.ComponentRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class ComponentService {

    private final ComponentRepository repository;

    public ComponentService(ComponentRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> getAll() {
        List<ComponentItem> items = repository.findAll();
        return Map.of("items", items, "totalCount", repository.count());
    }
}
