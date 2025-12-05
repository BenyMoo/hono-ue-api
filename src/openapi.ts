// OpenAPI 文档配置
export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Hono UE API',
    version: '1.0.0',
    description: '用户管理和会员系统 API'
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: '本地开发服务器'
    }
  ],
  // API 路径定义
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['认证'],
        summary: '用户注册',
        description: '注册新用户账户',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  nickname: { type: 'string', example: '用户昵称', nullable: true }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '201': {
            description: '注册成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: '注册成功' }
                  }
                }
              }
            }
          },
          '400': {
            description: '验证错误或用户已存在',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '邮箱已被注册' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        description: '用户账户登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string', description: 'JWT 访问令牌' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        email: { type: 'string' },
                        nickname: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: '无效凭证',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '用户不存在或密码错误' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/checkin': {
      post: {
        tags: ['签到'],
        summary: '每日签到',
        description: '用户每日签到获取积分',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '签到成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: '签到成功 (Check-in successful)' },
                    pointsEarned: { type: 'number', example: 10, description: '获得的积分数量' }
                  }
                }
              }
            }
          },
          '400': {
            description: '今天已经签到过了',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '今天已经签到过了 (Already checked in today)' }
                  }
                }
              }
            }
          },
          '401': {
            description: '未认证或令牌无效',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '未认证' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '签到失败 (Check-in failed)' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/membership/redeem': {
      post: {
        tags: ['会员'],
        summary: '兑换会员',
        description: '使用积分兑换会员资格',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '兑换成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: '会员兑换成功 (Membership redeemed successfully)' },
                    expireAt: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59.999Z', description: '会员到期时间' },
                    remainingPoints: { type: 'number', example: 50, description: '剩余积分' }
                  }
                }
              }
            }
          },
          '400': {
            description: '积分不足',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '积分不足，需要 100 积分 (Insufficient points)' }
                  }
                }
              }
            }
          },
          '401': {
            description: '未认证或令牌无效',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '未认证' }
                  }
                }
              }
            }
          },
          '404': {
            description: '用户不存在',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '用户不存在 (User not found)' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '兑换失败 (Redemption failed)' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/membership/status': {
      get: {
        tags: ['会员'],
        summary: '获取会员状态',
        description: '获取当前用户的会员状态和积分信息',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isMember: { type: 'boolean', example: true, description: '是否为会员' },
                    points: { type: 'number', example: 150, description: '当前积分' },
                    expireAt: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59.999Z', nullable: true, description: '会员到期时间' },
                    nickname: { type: 'string', example: '用户昵称', nullable: true },
                    avatar: { type: 'string', example: 'https://example.com/avatar.jpg', nullable: true }
                  }
                }
              }
            }
          },
          '401': {
            description: '未认证或令牌无效',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '未认证' }
                  }
                }
              }
            }
          },
          '404': {
            description: '用户不存在',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: '用户不存在 (User not found)' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  // API 标签分组
  tags: [
    {
      name: '认证',
      description: '用户认证相关接口'
    },
    {
      name: '签到',
      description: '签到相关接口'
    },
    {
      name: '会员',
      description: '会员相关接口'
    }
  ],
  // 安全认证方案
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};