# Use the official .NET 8 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution file and project files
COPY ProjectHub/ProjectHub.sln ./
COPY ProjectHub/ProjectHub.API/ProjectHub.API.csproj ./ProjectHub.API/
COPY ProjectHub/ProjectHub.Core/ProjectHub.Core.csproj ./ProjectHub.Core/
COPY ProjectHub/ProjectHub.Infrastructure/ProjectHub.Infrastructure.csproj ./ProjectHub.Infrastructure/
COPY ProjectHub/NUnitTests/NUnitTests.csproj ./NUnitTests/

# Restore dependencies
RUN dotnet restore

# Copy the rest of the source code
COPY ProjectHub/ ./

# Build the application
RUN dotnet publish ProjectHub.API/ProjectHub.API.csproj -c Release -o out

# Use the official .NET 8 runtime image for running
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy the built application from the build stage
COPY --from=build /app/out .

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Docker

# Run the application
ENTRYPOINT ["dotnet", "ProjectHub.API.dll"] 