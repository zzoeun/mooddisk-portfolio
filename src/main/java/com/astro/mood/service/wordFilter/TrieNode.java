package com.astro.mood.service.wordFilter;//package com.astro.mood.service.text;

import java.util.HashMap;
import java.util.Map;

public class TrieNode {
    Map<Character, TrieNode> children = new HashMap<>();
    boolean isEndOfWord = false; // 패턴의 끝을 나타냄
    TrieNode failureLink; // 실패 링크

   }

