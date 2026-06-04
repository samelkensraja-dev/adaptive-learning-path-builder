package com.nilaapps.adaptive.controller;

import com.nilaapps.adaptive.service.ComponentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    private final ComponentService service;

    public ComponentController(ComponentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }
}
