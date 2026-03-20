"""
LeetCode-style technical interview prompts: full problem statements only
(no separate “what to include in your answer” footer).
"""

# --- Shared prompts (LeetCode-like: title + description + example/constraints) ---

TWO_SUM = (
    "Two Sum\n\n"
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. "
    "You may assume exactly one solution exists, and you may not use the same element twice. Return the answer in any order.\n\n"
    "Example: nums = [2, 7, 11, 15], target = 9 → you may return [0, 1] because nums[0] + nums[1] == 9."
)

VALID_PARENTHESES = (
    "Valid Parentheses\n\n"
    "Given a string s containing only the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. "
    "A string is valid if brackets are closed in the correct order.\n\n"
    "Examples: \"()\" and \"()[]{}\" are valid; \"(]\" and \"([)]\" are not."
)

MERGE_TWO_SORTED_LISTS = (
    "Merge Two Sorted Lists\n\n"
    "You are given the heads of two sorted linked lists list1 and list2. "
    "Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\n"
    "Return the head of the merged linked list. The merged list should also be sorted in non-decreasing order."
)

REVERSE_LINKED_LIST = (
    "Reverse Linked List\n\n"
    "Given the head of a singly linked list, reverse the list and return the reversed list’s head. "
    "Do this by rearranging pointers (iteratively or recursively)."
)

PALINDROME = (
    "Valid Palindrome\n\n"
    "Given a string s, determine if it is a palindrome after considering only alphanumeric characters and ignoring cases. "
    "For example, \"A man, a plan, a canal: Panama\" is a valid palindrome under these rules."
)

MAX_DEPTH_BINARY_TREE = (
    "Maximum Depth of Binary Tree\n\n"
    "Given the root of a binary tree, return its maximum depth (the number of nodes along the longest path from the root down to a leaf). "
    "An empty tree has depth 0."
)

DETECT_CYCLE_LINKED_LIST = (
    "Linked List Cycle II\n\n"
    "Given the head of a linked list that may contain a cycle, return the node where the cycle begins; "
    "if there is no cycle, return null. A cycle exists if some node can be reached again by following next pointers."
)

REVERSE_WORDS = (
    "Reverse Words in a String\n\n"
    "Given an input string s, reverse the order of the words. "
    "A word is defined as a sequence of non-space characters. Words are separated by at least one space. "
    "Return a string with words in reverse order, with single spaces between words (trim extra spaces)."
)

STR_STR = (
    "Find the Index of the First Occurrence in a String (strStr)\n\n"
    "Given two strings haystack and needle, return the index of the first occurrence of needle in haystack, "
    "or -1 if needle is not part of haystack. For needle length 0, define the answer as 0."
)

BEST_TIME_STOCK = (
    "Best Time to Buy and Sell Stock\n\n"
    "You are given an array prices where prices[i] is the price of a stock on day i. "
    "You may complete at most one transaction: buy on one day and sell on a later day. "
    "Return the maximum profit you can achieve; if no profit is possible, return 0."
)

QUEUE_USING_STACKS = (
    "Implement Queue using Stacks\n\n"
    "Implement a first-in-first-out (FIFO) queue using only two stacks. "
    "It should support push (element to back), pop (remove front), peek (front element), and empty checks. "
    "All operations should be correct for a queue’s semantics."
)

LONGEST_SUBSTRING_NO_REPEAT = (
    "Longest Substring Without Repeating Characters\n\n"
    "Given a string s, find the length of the longest substring without repeating characters. "
    "A substring is a contiguous sequence of characters within s.\n\n"
    "Examples: s = \"abcabcbb\" the answer is 3 (e.g. substring \"abc\"). s = \"bbbbb\" the answer is 1. "
    "s = \"pwwkew\" the answer is 3 (e.g. substring \"wke\").\n\n"
    "Return a single integer: the length of that longest substring."
)

THREE_SUM = (
    "3Sum\n\n"
    "Given an integer array nums, return all triplets [nums[i], nums[j], nums[k]] such that i, j, k are distinct indices "
    "and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets "
    "(same three values in any order should appear once)."
)

ADD_TWO_NUMBERS = (
    "Add Two Numbers\n\n"
    "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, "
    "and each node contains a single digit. Add the two numbers and return the sum as a linked list in the same reverse-digit format.\n\n"
    "Example: l1 = [2,4,3], l2 = [5,6,4] represents 342 + 465 = 807, so output should be [7,0,8]."
)

CONTAINER_WATER = (
    "Container With Most Water\n\n"
    "You are given n non-negative integers a1, a2, …, an where each represents a point at coordinate (i, ai). "
    "n vertical lines are drawn such that the endpoints are (i, ai) and (i, 0). "
    "Find two lines that together with the x-axis form a container that holds the most water. "
    "Return the maximum amount of water the container can store. You cannot slant the container."
)

GROUP_ANAGRAMS = (
    "Group Anagrams\n\n"
    "Given an array of strings strs, group the anagrams together. You can return the groups in any order. "
    "An anagram is formed by rearranging letters of a different word, using all original letters exactly once.\n\n"
    "Example: strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"] → one valid grouping is [[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]."
)

LRU_CACHE = (
    "LRU Cache\n\n"
    "Design a Least Recently Used (LRU) cache that supports get(key) and put(key, value). "
    "Both should run in O(1) average time. The cache has a positive capacity cap; "
    "when inserting beyond cap, evict the least recently used entry before adding the new one. "
    "get(key) returns the value if present, else -1. put updates or inserts the key."
)

NUMBER_OF_ISLANDS = (
    "Number of Islands\n\n"
    "Given an m x n 2D binary grid grid where '1' represents land and '0' represents water, "
    "count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands "
    "horizontally or vertically (not diagonally). Assume all four edges of the grid are water."
)

COPY_LIST_RANDOM_POINTER = (
    "Copy List with Random Pointer\n\n"
    "A linked list of length n has each node with a value, a next pointer, and a random pointer that may point to any node or null. "
    "Construct a deep copy of the list: a new list with the same structure and values, but new nodes; "
    "random pointers in the copy should point into the copied list, not the original."
)

WORD_BREAK = (
    "Word Break\n\n"
    "Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence "
    "of one or more dictionary words (words may be reused). "
    "The same word may appear multiple times in the dictionary."
)

REVERSE_LINKED_LIST_II = (
    "Reverse Linked List II\n\n"
    "Given the head of a singly linked list and integers left and right where left ≤ right, "
    "reverse the nodes from position left to position right (1-indexed) and return the list’s new head."
)

LEVEL_ORDER_TRAVERSAL = (
    "Binary Tree Level Order Traversal\n\n"
    "Given the root of a binary tree, return the level-order traversal of its nodes’ values "
    "(left to right, level by level)."
)

SET_MATRIX_ZEROES = (
    "Set Matrix Zeroes\n\n"
    "Given an m x n integer matrix, if an element is 0, set its entire row and column to 0. "
    "Do it in place if possible (using O(1) extra space aside from trivial inputs)."
)

LCA_BINARY_TREE = (
    "Lowest Common Ancestor of a Binary Tree\n\n"
    "Given a binary tree whose node values are unique, and two distinct nodes p and q that exist in the tree, "
    "return the lowest common ancestor (the deepest node that has both p and q as descendants, allowing a node to be a descendant of itself)."
)

MERGE_K_SORTED_LISTS = (
    "Merge k Sorted Lists\n\n"
    "You are given an array of k linked lists; each list is sorted in ascending order. "
    "Merge all lists into one sorted linked list and return its head."
)

TRAPPING_RAIN_WATER = (
    "Trapping Rain Water\n\n"
    "Given n non-negative integers representing an elevation map (width 1), "
    "compute how much water the map can trap after raining. Water cannot be trapped outside the elevation profile."
)

MEDIAN_TWO_SORTED = (
    "Median of Two Sorted Arrays\n\n"
    "Given two sorted arrays nums1 and nums2 of sizes m and n, return the median of the two sorted arrays. "
    "The overall run time complexity should be O(log(min(m, n))) for a full-credit solution."
)

SERIALIZE_BINARY_TREE = (
    "Serialize and Deserialize Binary Tree\n\n"
    "Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure. "
    "Serialization is the process of turning a data structure into a bit sequence; deserialization reconstructs the tree from that encoding. "
    "Your format can be any reasonable encoding as long as encode then decode recovers the tree."
)

WORD_LADDER_II = (
    "Word Ladder II\n\n"
    "Given two words beginWord and endWord, and a dictionary wordList containing distinct words of the same length, "
    "return all shortest transformation sequences from beginWord to endWord such that each adjacent pair differs by exactly one letter "
    "and each intermediate word exists in wordList (beginWord may be omitted from the list). "
    "If no sequence exists, return an empty list."
)

# --- Pools by company (same canonical problems, varied mixes) ---

LEETCODE_STYLE_GENERAL = {
    "easy": [
        TWO_SUM,
        VALID_PARENTHESES,
        MERGE_TWO_SORTED_LISTS,
        REVERSE_LINKED_LIST,
        MAX_DEPTH_BINARY_TREE,
    ],
    "medium": [
        LONGEST_SUBSTRING_NO_REPEAT,
        ADD_TWO_NUMBERS,
        THREE_SUM,
        CONTAINER_WATER,
        GROUP_ANAGRAMS,
    ],
    "hard": [
        MERGE_K_SORTED_LISTS,
        TRAPPING_RAIN_WATER,
        MEDIAN_TWO_SORTED,
    ],
}

LEETCODE_STYLE_QUESTIONS = {
    "google": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            MERGE_TWO_SORTED_LISTS,
            REVERSE_LINKED_LIST,
            PALINDROME,
        ],
        "medium": [
            LONGEST_SUBSTRING_NO_REPEAT,
            THREE_SUM,
            ADD_TWO_NUMBERS,
            CONTAINER_WATER,
            GROUP_ANAGRAMS,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
            MEDIAN_TWO_SORTED,
            SERIALIZE_BINARY_TREE,
        ],
    },
    "amazon": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            REVERSE_WORDS,
            DETECT_CYCLE_LINKED_LIST,
            MAX_DEPTH_BINARY_TREE,
        ],
        "medium": [
            LRU_CACHE,
            LONGEST_SUBSTRING_NO_REPEAT,
            NUMBER_OF_ISLANDS,
            COPY_LIST_RANDOM_POINTER,
            WORD_BREAK,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
            WORD_LADDER_II,
        ],
    },
    "microsoft": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            MERGE_TWO_SORTED_LISTS,
            MAX_DEPTH_BINARY_TREE,
            STR_STR,
        ],
        "medium": [
            ADD_TWO_NUMBERS,
            LONGEST_SUBSTRING_NO_REPEAT,
            REVERSE_LINKED_LIST_II,
            LEVEL_ORDER_TRAVERSAL,
            SET_MATRIX_ZEROES,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
            SERIALIZE_BINARY_TREE,
        ],
    },
    "meta": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            MERGE_TWO_SORTED_LISTS,
            MAX_DEPTH_BINARY_TREE,
            BEST_TIME_STOCK,
        ],
        "medium": [
            ADD_TWO_NUMBERS,
            LONGEST_SUBSTRING_NO_REPEAT,
            THREE_SUM,
            LEVEL_ORDER_TRAVERSAL,
            LCA_BINARY_TREE,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
            SERIALIZE_BINARY_TREE,
        ],
    },
    "apple": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            MERGE_TWO_SORTED_LISTS,
            REVERSE_LINKED_LIST,
            QUEUE_USING_STACKS,
        ],
        "medium": [
            LONGEST_SUBSTRING_NO_REPEAT,
            ADD_TWO_NUMBERS,
            LRU_CACHE,
            NUMBER_OF_ISLANDS,
            GROUP_ANAGRAMS,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
            SERIALIZE_BINARY_TREE,
        ],
    },
    "netflix": {
        "easy": [
            TWO_SUM,
            VALID_PARENTHESES,
            MERGE_TWO_SORTED_LISTS,
            REVERSE_LINKED_LIST,
        ],
        "medium": [
            LONGEST_SUBSTRING_NO_REPEAT,
            LRU_CACHE,
            GROUP_ANAGRAMS,
            NUMBER_OF_ISLANDS,
        ],
        "hard": [
            MERGE_K_SORTED_LISTS,
            TRAPPING_RAIN_WATER,
        ],
    },
}
