package com.astro.mood.data.entity.emotion;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum Emotion {
    HAPPY(1, "행복"),
    PROUD(2, "뿌듯"),
    PEACEFUL(3, "평온"),
    DEPRESSED(4, "우울"),
    ANNOYED(5, "짜증"),
    FURIOUS(6, "분노");

    private final int idx;
    private final String description;

    public static Emotion fromDescription(String description) {
        for (Emotion emotion : Emotion.values()) {
            if (emotion.getDescription().equals(description)) {
                return emotion;
            }
        }
        throw new IllegalArgumentException("Invalid emotion description: " + description);
    }
}
