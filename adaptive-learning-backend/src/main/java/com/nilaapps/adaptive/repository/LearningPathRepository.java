package com.nilaapps.adaptive.repository;

import com.nilaapps.adaptive.model.LearningPath;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Repository
public class LearningPathRepository {

    private final Map<String, LearningPath> store = new ConcurrentHashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1);

    public List<LearningPath> findAll() {
        return new ArrayList<>(store.values());
    }

    public Optional<LearningPath> findById(String id) {
        return Optional.ofNullable(store.get(id));
    }

    public LearningPath save(LearningPath lp) {
        if (lp.getId() == null || lp.getId().isBlank()) {
            lp.setId("lp-" + idSequence.getAndIncrement());
        }
        store.put(lp.getId(), lp);
        return lp;
    }

    public boolean existsById(String id) {
        return store.containsKey(id);
    }

    public boolean deleteById(String id) {
        return store.remove(id) != null;
    }
}
