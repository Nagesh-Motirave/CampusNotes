package com.campusnoteshub.notes.config;

import com.campusnoteshub.notes.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class PointsSyncRunner implements CommandLineRunner {

    @Autowired
    private NoteService noteService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Starting PointsSyncRunner to recalculate user points based on approved notes...");
        try {
            noteService.recalculateAllPoints();
            System.out.println("PointsSyncRunner completed successfully.");
        } catch (Exception e) {
            System.err.println("PointsSyncRunner encountered an error: " + e.getMessage());
        }
    }
}
