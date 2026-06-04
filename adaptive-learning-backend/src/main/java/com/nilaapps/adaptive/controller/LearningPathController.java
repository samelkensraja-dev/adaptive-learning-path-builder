package com.nilaapps.adaptive.controller;

import com.nilaapps.adaptive.model.LearningPath;
import com.nilaapps.adaptive.service.LearningPathService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/learning-paths")
public class LearningPathController {

    private final LearningPathService service;

    public LearningPathController(LearningPathService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<LearningPath>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPath> getById(@PathVariable String id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LearningPath> create(@Valid @RequestBody LearningPath lp) {
        // CHANGED: BL-1 — was calling non-existent service.save(); renamed to service.create()
        lp.setId(null); // CHANGED: B-10 mass-assignment guard — strip client-supplied id on create
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(lp));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LearningPath> update(@PathVariable String id, @Valid @RequestBody LearningPath lp) {
        // CHANGED: B-10 mass-assignment guard — version incremented server-side, never from client
        lp.setId(null);
        return service.update(id, lp)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        return service.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
