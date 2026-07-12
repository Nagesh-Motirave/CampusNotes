package com.campusnoteshub.user;

import com.campusnoteshub.user.model.User;
import com.campusnoteshub.user.repository.UserRepository;
import com.campusnoteshub.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class TestRankingsRunner implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Override
    public void run(String... args) throws Exception {
        if (!java.util.Arrays.asList(args).contains("--run-tests")) {
            return;
        }

        System.out.println("=========================================");
        System.out.println("RUNNING RANKING SYSTEM VERIFICATION TESTS");
        System.out.println("=========================================");

        // Clear existing users for clean test
        userRepository.deleteAll();

        // Student A: 25 approved notes -> 125 points
        User studentA = new User();
        studentA.setId("studentA");
        studentA.setName("Student A");
        studentA.setEmail("a@example.com");
        studentA.setPoints(125);
        studentA.setLastPointsUpdate(LocalDateTime.now().minusDays(5)); // Oldest
        userRepository.save(studentA);

        // Student B: 18 approved notes -> 90 points
        User studentB = new User();
        studentB.setId("studentB");
        studentB.setName("Student B");
        studentB.setEmail("b@example.com");
        studentB.setPoints(90);
        studentB.setLastPointsUpdate(LocalDateTime.now().minusDays(3));
        userRepository.save(studentB);

        // Student C: 12 approved notes -> 60 points
        User studentC = new User();
        studentC.setId("studentC");
        studentC.setName("Student C");
        studentC.setEmail("c@example.com");
        studentC.setPoints(60);
        studentC.setLastPointsUpdate(LocalDateTime.now().minusDays(1));
        userRepository.save(studentC);

        // Tie Breaker Test
        // Student D: 18 approved notes -> 90 points (Tie with B, but later update)
        User studentD = new User();
        studentD.setId("studentD");
        studentD.setName("Student D");
        studentD.setEmail("d@example.com");
        studentD.setPoints(90);
        studentD.setLastPointsUpdate(LocalDateTime.now().minusDays(2)); // Later than B
        userRepository.save(studentD);

        // Fetch Profiles to calculate ranks dynamically
        System.out.println(studentA.getName() + " (125 pts) -> Rank: " + userService.getUserProfile("studentA").getRank());
        System.out.println(studentB.getName() + " (90 pts, older update) -> Rank: " + userService.getUserProfile("studentB").getRank());
        System.out.println(studentD.getName() + " (90 pts, newer update) -> Rank: " + userService.getUserProfile("studentD").getRank());
        System.out.println(studentC.getName() + " (60 pts) -> Rank: " + userService.getUserProfile("studentC").getRank());

        System.out.println("=========================================");
        System.exit(0);
    }
}
