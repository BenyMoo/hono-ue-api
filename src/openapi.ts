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
    '/api/checkin/history': {
      get: {
        tags: ['签到'],
        summary: '获取签到历史',
        description: '获取用户的签到历史记录',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    history: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'integer', example: 1 },
                          checkinDate: { type: 'string', format: 'date', example: '2023-12-01' },
                          pointsEarned: { type: 'integer', example: 10 },
                          createdAt: { type: 'string', format: 'date-time', example: '2023-12-01T08:00:00.000Z' }
                        }
                      }
                    },
                    totalCount: { type: 'integer', example: 30 }
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
                    error: { type: 'string', example: '获取签到历史失败' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/checkin/status': {
      get: {
        tags: ['签到'],
        summary: '获取今日签到状态',
        description: '获取用户今日是否已签到',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    checkedIn: { type: 'boolean', example: false, description: '今日是否已签到' },
                    checkinDate: { type: 'string', format: 'date', example: '2023-12-01', description: '签到日期' }
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
                    error: { type: 'string', example: '获取签到状态失败' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/membership/redeem-history': {
      get: {
        tags: ['会员'],
        summary: '获取会员兑换历史',
        description: '获取用户的会员兑换历史记录',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentMember: {
                      type: 'object',
                      properties: {
                        isMember: { type: 'boolean', example: true },
                        expireAt: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59.999Z', nullable: true },
                        points: { type: 'number', example: 150 }
                      }
                    },
                    history: {
                      type: 'array',
                      items: { type: 'object' }
                    }
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
                    error: { type: 'string', example: '获取会员历史失败' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats/user': {
      get: {
        tags: ['统计'],
        summary: '获取用户统计',
        description: '获取用户的详细统计信息，包括签到、会员等数据',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        email: { type: 'string', example: 'user@example.com' },
                        nickname: { type: 'string', example: '用户昵称' },
                        avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                        points: { type: 'integer', example: 150 },
                        isMember: { type: 'boolean', example: true },
                        memberExpireAt: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59.999Z', nullable: true },
                        createdAt: { type: 'string', format: 'date-time', example: '2023-01-01T00:00:00.000Z' }
                      }
                    },
                    checkin: {
                      type: 'object',
                      properties: {
                        totalCheckins: { type: 'integer', example: 30 },
                        totalPointsEarned: { type: 'integer', example: 300 },
                        lastCheckinDate: { type: 'string', format: 'date', example: '2023-12-01', nullable: true }
                      }
                    },
                    membership: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'active', enum: ['active', 'inactive'] },
                        expireAt: { type: 'string', format: 'date-time', example: '2023-12-31T23:59:59.999Z', nullable: true }
                      }
                    }
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
                    error: { type: 'string', example: '用户不存在' }
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
                    error: { type: 'string', example: '获取用户统计失败' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats/leaderboard': {
      get: {
        tags: ['统计'],
        summary: '获取积分排行榜',
        description: '获取用户积分排行榜',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: '返回条数限制，最多100条',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
          }
        ],
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    leaderboard: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          rank: { type: 'integer', example: 1 },
                          userId: { type: 'integer', example: 1 },
                          nickname: { type: 'string', example: '用户昵称' },
                          avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                          points: { type: 'integer', example: 1000 },
                          isMember: { type: 'boolean', example: true }
                        }
                      }
                    },
                    totalCount: { type: 'integer', example: 100 }
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
                    error: { type: 'string', example: '获取排行榜失败' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats/system': {
      get: {
        tags: ['统计'],
        summary: '获取系统统计',
        description: '获取系统总体统计信息（管理员功能）',
        responses: {
          '200': {
            description: '获取成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: {
                      type: 'object',
                      properties: {
                        totalUsers: { type: 'integer', example: 1000 },
                        totalMembers: { type: 'integer', example: 100 },
                        totalPoints: { type: 'integer', example: 50000 },
                        avgPoints: { type: 'integer', example: 50 }
                      }
                    },
                    checkins: {
                      type: 'object',
                      properties: {
                        totalCheckins: { type: 'integer', example: 5000 },
                        todayCheckins: { type: 'integer', example: 100 },
                        totalPointsEarned: { type: 'integer', example: 50000 }
                      }
                    }
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
                    error: { type: 'string', example: '获取系统统计失败' }
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
    },
    {
      name: '统计',
      description: '统计相关接口'
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