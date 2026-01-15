package com.astro.mood.service.wordFilter;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BadwordFilterService {
    private final ProfanityLoader profanityLoader = new ProfanityLoader();
    private final Trie trie = new Trie();
    private List<String> exceptions; // 예외 단어 리스트 추가

    @PostConstruct
    public void init() {
        List<String> profanities = profanityLoader.loadProfanities();// 비속어 리스트 로드
        exceptions = profanityLoader.loadExceptions();// 예외 단어 리스트 로드
        for (String profanity : profanities) {
            trie.insert(profanity);
        }
        trie.buildFailureLinks();// 실패 링크 구축
    }

    // 필터링
    public Boolean textFilterCheck(String text) {
        Trie.TrieNode current = trie.getRoot(); // Trie의 루트 노드를 현재 노드로 초기화
        StringBuilder foundProfanity = new StringBuilder(); // 발견된 비속어를 저장할 StringBuilder

        // 입력된 텍스트의 각 문자에 대해 반복
        for (char c : text.toCharArray()) {
            // 현재 노드에서 자식 노드가 없을 때까지 실패 링크를 따라감
            while (current != null && !current.children.containsKey(c)) {
                current = current.failLink; // 실패 링크를 따라감
            }
            // 현재 노드가 null이면 루트 노드로 돌아감, 자식 노드가 있으면 그 노드로 이동
            current = (current == null) ? trie.getRoot() : current.children.get(c);

            // 현재 노드에서 비속어가 발견되었는지 확인
            Trie.TrieNode temp = current;
            while (temp != null) {
                // 현재 노드가 단어의 끝인지 확인
                if (temp.isEndOfWord) {
                    String foundWord = extractProfanity(text, c, temp); //비속어 추출
                    if (!isException(foundWord)) { //예외단어에 포함되는지 확인
                        // 발견된 비속어를 StringBuilder에 추가
                        foundProfanity.append(foundWord).append(" ");
                        return false; // 비속어가 발견되면 false 반환
                    }
                }
                temp = temp.failLink; // 실패 링크를 따라 다음 노드로 이동
            }
        }

        return true; // 비속어가 발견되지 않으면 true 반환
    }

    //비속어 추출
    private String extractProfanity(String text, char c, Trie.TrieNode current) {
        int endIndex = text.indexOf(c) + 1; // 비속어의 끝 인덱스 계산
        // 비속어 시작 인덱스는 current의 깊이에 따라 결정
        int startIndex = endIndex - (current.isEndOfWord ? 5 : 0); // 비속어의 길이에 따라 조정
        if (startIndex < 0) {
            startIndex = 0; // 범위를 벗어날 경우 0으로 설정
        }
        return text.substring(startIndex, endIndex); // 비속어 반환
    }

    //예외단어에 속하는지 확인
    private boolean isException(String word) {

        boolean isException = exceptions.stream()
                .anyMatch(exception -> word.contains(exception)); // 입력 값에 예외 단어가 포함되어 있는지 검사
        log.info("추출된 비속어 : {}, {}",isException, word);
        log.info("예외 단어 리스트: {}", exceptions);
        // 예외 단어 리스트에 포함되어 있는지 확인
        return isException;


//        return exceptions.stream().anyMatch(exception -> word.contains(exception));
    }
}