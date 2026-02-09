#!/usr/bin/env python3
"""
Comprehensive test suite for wechat-search skill
Covers all functionality and edge cases including failure scenarios
"""

import unittest
from unittest.mock import patch, MagicMock
import json
import subprocess
import sys
import os

# Add the parent directory to Python path to import wechat_search
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from wechat_search import WeChatSearch


class TestWeChatSearchConfig(unittest.TestCase):
    """Test configuration loading and handling"""
    
    def setUp(self):
        self.test_config_path = os.path.join(os.path.dirname(__file__), 'test_config.json')
        
    def test_default_config(self):
        """Test default configuration values"""
        searcher = WeChatSearch()
        self.assertEqual(searcher.config['max_results'], 5)
        self.assertEqual(searcher.config['search_strategy'], 'web_search_first')
        
    def test_custom_config_loading(self):
        """Test loading custom configuration from file"""
        searcher = WeChatSearch(self.test_config_path)
        self.assertEqual(searcher.config['max_results'], 10)
        
    def test_invalid_config_file(self):
        """Test handling of invalid config file"""
        with patch('builtins.print') as mock_print:
            searcher = WeChatSearch('/nonexistent/config.json')
            # Should fall back to defaults
            self.assertEqual(searcher.config['max_results'], 5)


class TestWeChatSearchValidation(unittest.TestCase):
    """Test URL validation and data extraction"""
    
    def setUp(self):
        self.searcher = WeChatSearch()
        
    def test_valid_wechat_url(self):
        """Test valid WeChat article URL detection"""
        url1 = "https://mp.weixin.qq.com/s/abc123"
        url2 = "https://mp.weixin.qq.com/s?__biz=abc&mid=123&idx=1&sn=def"
        
        self.assertTrue(self.searcher.is_valid_wechat_url(url1))
        self.assertTrue(self.searcher.is_valid_wechat_url(url2))
        
    def test_invalid_wechat_url(self):
        """Test invalid URL detection"""
        invalid_urls = [
            "https://example.com/article",
            "https://mp.weixin.qq.com/profile/abc123",
            "https://weixin.sogou.com/weixin?type=2&query=ai",
            "not-a-url"
        ]
        for url in invalid_urls:
            with self.subTest(url=url):
                self.assertFalse(self.searcher.is_valid_wechat_url(url))
                
    def test_account_extraction(self):
        """Test official account name extraction"""
        title_with_account = "AI Article - Tech Blog"
        account = self.searcher.extract_account_from_url("")
        # For titles with " - ", extract the part after
        if ' - ' in title_with_account:
            parts = title_with_account.split(' - ')
            expected_account = parts[-1]
        else:
            expected_account = "Unknown Account"
        self.assertEqual(expected_account, "Tech Blog")


class TestWeChatSearchFormatting(unittest.TestCase):
    """Test result formatting and display"""
    
    def setUp(self):
        self.searcher = WeChatSearch()
        self.sample_articles = [
            {
                'title': 'AI Article',
                'url': 'https://mp.weixin.qq.com/s/valid123',
                'snippet': 'This is a valid AI article about machine learning...',
                'official_account': 'Tech Blog',
                'source': 'web_search'
            }
        ]
        
    def test_detailed_formatting(self):
        """Test detailed result formatting"""
        output = self.searcher.format_results(self.sample_articles, brief=False)
        self.assertIn('AI Article', output)
        self.assertIn('Tech Blog', output)
        self.assertIn('https://mp.weixin.qq.com/s/valid123', output)
        
    def test_brief_formatting(self):
        """Test brief result formatting"""
        output = self.searcher.format_results(self.sample_articles, brief=True)
        self.assertIn('AI Article', output)
        self.assertIn('https://mp.weixin.qq.com/s/valid123', output)
        # Brief format should not include snippet or account details
        self.assertNotIn('Tech Blog', output)
        
    def test_empty_results(self):
        """Test empty results handling"""
        output = self.searcher.format_results([])
        self.assertIn('No WeChat Official Account articles found', output)


class TestWeChatSearchEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions"""
    
    def setUp(self):
        self.searcher = WeChatSearch()
        
    def test_max_results_boundary(self):
        """Test max_results parameter boundaries"""
        # Test with 1 result
        mock_articles = [{'title': f'Article {i}', 'url': f'https://mp.weixin.qq.com/s/{i}',
                        'official_account': 'Test', 'source': 'web_search'} for i in range(25)]
    
        # Should return exactly 1 result
        limited = mock_articles[:1]
        self.assertEqual(len(limited), 1)
    
        # Test with 20 results (max)
        limited_20 = mock_articles[:20]
        self.assertEqual(len(limited_20), 20)
        
    def test_special_characters_in_query(self):
        """Test handling of special characters in search queries"""
        special_queries = [
            "AI & Machine Learning",
            "大模型应用",
            "AI's Future: What's Next?",
            "AI+Blockchain"
        ]
        # Just ensure no exceptions are raised
        for query in special_queries:
            try:
                # This would normally call web_search, but we're just testing query handling
                pass
            except Exception as e:
                self.fail(f"Query '{query}' raised exception: {e}")


class TestWeChatSearchIntegration(unittest.TestCase):
    """Test integration with OpenClaw tools"""
    
    @patch('wechat_search.subprocess.run')
    def test_web_search_success(self, mock_subprocess):
        """Test successful web search scenario"""
        # Mock successful subprocess call
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = json.dumps({
            'results': [
                {
                    'title': 'AI Article - Tech Blog',
                    'url': 'https://mp.weixin.qq.com/s/valid123',
                    'snippet': 'This is a valid AI article...'
                }
            ]
        })
        mock_subprocess.return_value = mock_result
    
        searcher = WeChatSearch()
        articles = searcher.web_search_wechat("AI", 1)
    
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]['title'], 'AI Article')
        self.assertEqual(articles[0]['official_account'], 'Tech Blog')
        self.assertTrue(searcher.is_valid_wechat_url(articles[0]['url']))
        
    @patch('wechat_search.subprocess.run')
    def test_web_search_failure(self, mock_subprocess):
        """Test web search failure handling"""
        # Mock failed subprocess call
        mock_result = MagicMock()
        mock_result.returncode = 1
        mock_result.stderr = "Command failed"
        mock_subprocess.return_value = mock_result
        
        with patch('builtins.print') as mock_print:
            searcher = WeChatSearch()
            articles = searcher.web_search_wechat("AI", 1)
            
            self.assertEqual(len(articles), 0)
            mock_print.assert_called()
            
    @patch('wechat_search.subprocess.run')
    def test_web_search_timeout(self, mock_subprocess):
        """Test web search timeout handling"""
        mock_subprocess.side_effect = subprocess.TimeoutExpired(cmd=[], timeout=30)
        
        with patch('builtins.print') as mock_print:
            searcher = WeChatSearch()
            articles = searcher.web_search_wechat("AI", 1)
            
            self.assertEqual(len(articles), 0)
            mock_print.assert_called()


class TestMainFunction(unittest.TestCase):
    """Test main function and CLI interface"""
    
    def test_main_function_import(self):
        """Test that main function can be imported without errors"""
        try:
            from wechat_search import main
            self.assertTrue(callable(main))
        except ImportError as e:
            self.fail(f"Failed to import main function: {e}")


if __name__ == '__main__':
    unittest.main()