ChatApp
│
├── src
│   ├── ChatApp.Api                → SignalR Gateway + REST
│   ├── ChatApp.Application        → UseCases / CQRS
│   ├── ChatApp.Domain             → Entities + Business Rules
│   ├── ChatApp.Infrastructure     → EF Core + gRPC + Redis
│   ├── ChatApp.Contracts          → gRPC Protos / DTOs
│
├── docker
│   ├── docker-compose.yml
│
└── 
