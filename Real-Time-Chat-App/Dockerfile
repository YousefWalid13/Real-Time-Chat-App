# -------- Build Stage --------
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /app
# Copy project file and restore
COPY *.csproj ./
RUN dotnet restore
# Copy rest of the files
COPY . ./
RUN dotnet publish -c Release -o out

# -------- Runtime Stage --------
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview
WORKDIR /app

# Install Kerberos library required by Npgsql Channel Binding / SSL
RUN apt-get update && apt-get install -y libgssapi-krb5-2 && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/out .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Real-Time-Chat-App.dll"]