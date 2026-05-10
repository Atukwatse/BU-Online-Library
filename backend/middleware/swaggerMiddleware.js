/**
 * Swagger/OpenAPI Documentation Setup
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BU Online Library API',
      version: '2.0.0',
      description: 'Production-ready E-library backend API with MySQL support',
      contact: {
        name: 'Bugema University IT Department',
        email: 'it@bugema.ac.ug',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.bugema.ac.ug/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            UserID: { type: 'integer' },
            FullName: { type: 'string' },
            Email: { type: 'string', format: 'email' },
            Role: { type: 'string', enum: ['Student', 'Staff', 'Admin', 'SuperAdmin'] },
            Status: { type: 'string', enum: ['Active', 'Suspended'] },
            DateRegistered: { type: 'string', format: 'date-time' },
          },
        },
        Book: {
          type: 'object',
          properties: {
            BookID: { type: 'integer' },
            Title: { type: 'string' },
            Author: { type: 'string' },
            ISBN: { type: 'string' },
            CategoryID: { type: 'integer' },
            Status: { type: 'string', enum: ['Available', 'Unavailable'] },
            DateAdded: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' },
            code: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/**/*.js', './controllers/**/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup,
};
