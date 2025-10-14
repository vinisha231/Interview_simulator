#!/usr/bin/env python3
"""
Test Script for Azure Deployment
===============================

This script tests all the endpoints of your deployed FastAPI application
to ensure everything is working correctly.

Usage:
    python test_deployment.py https://your-app-name.azurewebsites.net
"""

import requests
import sys
import json
from typing import Dict, Any

def test_endpoint(url: str, expected_status: int = 200) -> Dict[str, Any]:
    """Test a single endpoint and return the result."""
    try:
        response = requests.get(url, timeout=10)
        return {
            "url": url,
            "status_code": response.status_code,
            "success": response.status_code == expected_status,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
        }
    except Exception as e:
        return {
            "url": url,
            "status_code": None,
            "success": False,
            "error": str(e)
        }

def test_post_endpoint(url: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Test a POST endpoint and return the result."""
    try:
        response = requests.post(url, json=data, timeout=10)
        return {
            "url": url,
            "status_code": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200]
        }
    except Exception as e:
        return {
            "url": url,
            "status_code": None,
            "success": False,
            "error": str(e)
        }

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_deployment.py <your-app-url>")
        print("Example: python test_deployment.py https://llm-interview-simulator.azurewebsites.net")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    print(f"🧪 Testing deployment at: {base_url}")
    print("=" * 60)
    
    # Test endpoints
    endpoints = [
        ("/", "Root endpoint"),
        ("/health", "Health check"),
        ("/api/interview/", "Interview questions"),
        ("/api/interview/types", "Interview types"),
    ]
    
    results = []
    
    # Test GET endpoints
    for endpoint, description in endpoints:
        print(f"Testing {description}...")
        result = test_endpoint(f"{base_url}{endpoint}")
        results.append(result)
        
        if result["success"]:
            print(f"✅ {description}: {result['status_code']}")
        else:
            print(f"❌ {description}: {result.get('error', result['status_code'])}")
        print()
    
    # Test POST endpoint
    print("Testing interview evaluation...")
    post_data = {
        "question": "What is REST API?",
        "user_answer": "REST is a web service architecture that uses HTTP methods.",
        "interview_type": "technical"
    }
    
    post_result = test_post_endpoint(f"{base_url}/api/interview/evaluate", post_data)
    results.append(post_result)
    
    if post_result["success"]:
        print(f"✅ Interview evaluation: {post_result['status_code']}")
        print(f"   Response: {post_result['response']}")
    else:
        print(f"❌ Interview evaluation: {post_result.get('error', post_result['status_code'])}")
    
    print()
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    successful = sum(1 for r in results if r["success"])
    total = len(results)
    
    print(f"Successful tests: {successful}/{total}")
    
    if successful == total:
        print("🎉 All tests passed! Your deployment is working correctly.")
        print(f"🌍 Visit your API docs at: {base_url}/docs")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    
    print()
    print("🔗 Useful URLs:")
    print(f"   Main API: {base_url}/")
    print(f"   Health Check: {base_url}/health")
    print(f"   API Documentation: {base_url}/docs")
    print(f"   Interview Questions: {base_url}/api/interview/")

if __name__ == "__main__":
    main()
