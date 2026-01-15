package com.astro.mood.service.wordFilter;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.Map;

@Component
public class Trie {
    private final TrieNode root = new TrieNode(); // Trie의 루트 노드

    public void insert(String word) {
        TrieNode node = root; // 루트 노드에서 시작
        for (char c : word.toCharArray()) {
            // 각 문자에 대해 자식 노드가 없으면 새로 생성
            node = node.children.computeIfAbsent(c, k -> new TrieNode());
        }
        node.isEndOfWord = true; // 단어의 끝을 표시
    }

    public void buildFailureLinks() {
        LinkedList<TrieNode> queue = new LinkedList<>(); // BFS를 위한 큐 생성
        // 루트의 자식 노드에 대해 실패 링크 설정
        for (TrieNode child : root.children.values()) {
            child.failLink = root; // 루트 노드로 설정
            queue.add(child); // 큐에 추가
        }

        // 큐가 빌 때까지 반복
        while (!queue.isEmpty()) {
            TrieNode current = queue.poll(); // 현재 노드 가져오기
            for (char c : current.children.keySet()) {
                TrieNode child = current.children.get(c); // 자식 노드 가져오기
                TrieNode failNode = current.failLink; // 실패 링크 탐색

                // 실패 링크를 따라가며 자식 노드가 있는지 확인
                while (failNode != null && !failNode.children.containsKey(c)) {
                    failNode = failNode.failLink; // 실패 링크를 따라감
                }

                // 실패 링크 설정
                child.failLink = (failNode == null) ? root : failNode.children.get(c); // 실패 링크 연결
                queue.add(child); // 다음 노드를 큐에 추가
            }
        }
    }

    public TrieNode getRoot() {
        return root;
    }

    // Trie의 노드 클래스
    public static class TrieNode {
        boolean isEndOfWord; // 단어의 끝 여부
        TrieNode failLink;   // 실패 링크
        Map<Character, TrieNode> children = new HashMap<>(); // 자식 노드
    }
}