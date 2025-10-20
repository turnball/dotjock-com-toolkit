const path = require('path');

module.exports = {
    urls: [[
      'https://www.banecksfamilypark.com/',
      {
        url: 'https://www.banecksfamilypark.com/community/',
        rules: {
          TitleTag: {
            level: 'error',
            options: {
              "min": 20,
              "max": 70
            }
          },
          MetaDescription: {
            level: 'warn',
            options: {
              "min": 70,
              "max": 155
            }
          },
          H1Tag: {
            level: "error",
          },
          ImgTagWithAltAttribute: {
            level: 'error',
            options: {}
          },
          CanonicalLink: {
            level: 'error'
          },
          MetaSocial: {
            level: 'warn',
            options: {
              properties: [
                'og:title',
                'og:description',
                'og:image',
                'twitter:card',
                'twitter:title',
                'twitter:description',
                'twitter:image'
              ]
            } 
          },
          ConsistentTrailingSlash: {
            level: 'error',
            options: {
              enforce: true
            }
          },
          HeadingsStructure: {
            level: 'error',
            options: {
              enforce: true
            }
          },
          MetaViewport: {
            level: 'warn',
            options: {
              enforce: true
            }
          },
          InternalLinkStructure: {
            level: 'warn',
            options: {
              enforce: true
            }
          },
          BrokenLinks: {
            level: 'error',
            options: {
              enforce: true
            }
          },
          PageSpeedInsights: {
            level: 'warn',
            options: {
              strategy: 'mobile'
            }
          },
          StructuredData: {
            level: 'warn',
            options: {}
          },
          SitemapXml: {
            level: 'error',
            options: {
              enforce: true
            }
          },
          RobotsTxt: {
            level: 'warn',
            options: {
              enforce: true
            }
          },
          HreflangLinks: {
            level: 'warn',
            options: {}
          },
          ContentWordCount: {
            level: 'warn',
            options: {
              min: 300
            }
          },
          URLStructure: {
            level: 'warn',
            options: {}
          },
          MobileFriendly: {
            level: 'warn',
            options: {}
          },
          SecurityHeaders: {
            level: 'warn',
            options: {}
          },
          LinkRelPrevNext: {
            level: 'warn',
            options: {}
          },
          FontPerformance: {
            level: 'warn',
            options: {}
          },
          CookieUsage: {
            level: 'warn',
            options: {}
          },
          AccessibilityChecks: {
            level: 'warn',
            options: {}
          },
          OutboundLinks: {
            level: 'warn',
            options: {}
          },
          DeprecatedHTMLTags: {
            level: 'warn',
            options: {}
          },
          FlashContent: {
            level: 'warn',
            options: {}
          },
          IframeUsage: {
            level: 'warn',
            options: {}
          },
          MixedContent: {
            level: 'warn',
            options: {}
          },
          CrawlDepth: {
            level: 'warn',
            options: {}
          },
          PaginationLinks: {
            level: 'warn',
            options: {}
          },
          ImageOptimization: {
            level: 'warn',
            options: {}
          },
          VideoContent: {
            level: 'warn',
            options: {}
          },
          SocialSharingButtons: {
            level: 'warn',
            options: {}
          },
          AMPValidation: {
            level: 'warn',
            options: {}
          },
          ContentFreshness: {
            level: 'warn',
            options: {}
          },
          UserExperienceMetrics: {
            level: 'warn',
            options: {}
          },
          ServerResponseTime: {
            level: 'warn',
            options: {}
          },
          DomainAuthority: {
            level: 'warn',
            options: {}
          },
          BacklinkProfile: {
            level: 'warn',
            options: {}
          },
          LocalSEOFactors: {
            level: 'warn',
            options: {}
          },
          VoiceSearchOptimization: {
            level: 'warn',
            options: {}
          },
          FeaturedSnippets: {
            level: 'warn',
            options: {}
          },
          KnowledgeGraphPresence: {
            level: 'warn',
            options: {}
          },
          ContentReadability: {
            level: 'warn',
            options: {}
          },
          SemanticHTMLUsage: {
            level: 'warn',
            options: {}
          },
          CrawlBudgetOptimization: {
            level: 'warn',
            options: {}
          },
          ImageAltTextQuality: {
            level: 'warn',
            options: {}
          },
          URLCanonicalization: {
            level: 'warn',
            options: {}
          },
          HTMLMinification: {
            level: 'warn',
            options: {}
          },
          CSSMinification: {
            level: 'warn',
            options: {}
          },
          JSMinification: {
            level: 'warn',
            options: {}
          },
          ServerCaching: {
            level: 'warn',
            options: {}
          },
          ContentDeliveryNetworkUsage: {
            level: 'warn',
            options: {}
          },
          ImageLazyLoading: {
            level: 'warn',
            options: {}
          },
          PrefetchingTechniques: {
            level: 'warn',
            options: {}
          },
          HTTP2Implementation: {
            level: 'warn',
            options: {}
          },
          BrotliCompression: {  
            level: 'warn',
            options: {}
          }
        }
      }
    ],
    [
        'https://www.banecksfamilypark.com/',
        {
          url: 'https://www.banecksfamilypark.com/contact/',
          rules: {
            TitleTag: {
              level: 'error',
              options: {
                "required": true,
                "min": 15,
                "max": 60
              }
            }
          }
        }
    ],
    hostname: 'banecksfamilypark.com/',
    rulesdir: path.join(__dirname, 'rules/'),
    rules: {
      TitleTag: {
        level: 'error',
        options: {
          required: true,
          min: 15,
          max: 60
        }
      },
      MetaDescription: {
        level: 'warn',
        options: {
          required: true,
          min: 70,
          max: 155
        }
      },
      ImgTagWithAltAttribute: {
        level: 'warn',
        options: {
          required: true
        }
      },
      CanonicalLink: {
        level: 'error',
        options: {
          required: true
        }
      },
      MetaSocial: {
        level: 'warn',
        options: {
          properties: [
            'og:title',
            'og:description',
            'og:image',
            'twitter:card',
            'twitter:title',
            'twitter:description',
            'twitter:image'
          ]
        }
      },
      ConsistentTrailingSlash: {
        level: 'error',
        options: {
          required: true
        }
      },
      HeadingsStructure: {
        level: 'error',
        options: {
          required: true
        }
      },
      MetaViewport: {
        level: 'warn',
        options: {
          required: true
        }
      },
      InternalLinkStructure: {
        level: 'warn',
        options: {
          required: true
        }
      },
      BrokenLinks: {
        level: 'error',
        options: {}
      }      
    }
}
