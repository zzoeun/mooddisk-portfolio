package com.astro.mood.service.wordFilter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class ProfanityLoader {

    public List<String> loadProfanities() {
        List<String> profanities = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        String profanitiesFilePath = "profanities.json";
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(profanitiesFilePath)) {
            if (inputStream == null) {
                log.warn("비속어 파일을 찾을 수 없습니다: {}", profanitiesFilePath);
                return profanities;
            }
            JsonNode rootNode = objectMapper.readTree(inputStream);
            JsonNode profanitiesNode = rootNode.get("profanities");

            if (profanitiesNode.isArray()) {
                for (JsonNode profanity : profanitiesNode) {
                    profanities.add(profanity.asText());
                }
            }
        } catch (IOException e) {
            log.warn("비속어 리스트를 읽는 중 오류 발생: {}", e.getMessage());
        }
        return profanities;
    }

    public List<String> loadExceptions() {
        List<String> exceptions = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        String exceptionWordsFilePath = "exceptionWords.json";
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(exceptionWordsFilePath)) {
            if (inputStream == null) {
                log.error("예외 파일을 찾을 수 없습니다: {}", exceptionWordsFilePath);
                return exceptions;
            }
            JsonNode rootNode = objectMapper.readTree(inputStream);
            JsonNode exceptionsNode = rootNode.get("exceptions");

            if (exceptionsNode.isArray()) {
                for (JsonNode exception : exceptionsNode) {
                    exceptions.add(exception.asText());
                }
            }
        } catch (IOException e) {
            log.error("예외 리스트를 읽는 중 오류 발생", e);
        }
        return exceptions;
    }

}
