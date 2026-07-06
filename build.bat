@echo off
echo ===================================================
echo Building Campus Notes Hub Microservices
echo ===================================================

echo [1/5] Building API Gateway...
cd backend\api-gateway
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Error building api-gateway
    cd ..\..
    exit /b %ERRORLEVEL%
)

echo [2/5] Building Auth Service...
cd ..\auth-service
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Error building auth-service
    cd ..\..
    exit /b %ERRORLEVEL%
)

echo [3/5] Building User Service...
cd ..\user-service
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Error building user-service
    cd ..\..
    exit /b %ERRORLEVEL%
)

echo [4/5] Building Notes Service...
cd ..\notes-service
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Error building notes-service
    cd ..\..
    exit /b %ERRORLEVEL%
)

echo [5/5] Building File Upload Service...
cd ..\file-upload-service
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo Error building file-upload-service
    cd ..\..
    exit /b %ERRORLEVEL%
)

cd ..\..
echo ===================================================
echo All microservices compiled successfully.
echo ===================================================
