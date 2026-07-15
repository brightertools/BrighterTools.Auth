@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT=%SCRIPT_DIR%src\BrighterTools.Auth\BrighterTools.Auth.csproj"
set "NUGET_CONFIG=%SCRIPT_DIR%NuGet.config"
set "OUTPUT_DIR=%SCRIPT_DIR%artifacts\nuget"
set "CONFIGURATION=Release"
set "VERSION=%~1"

if not exist "%PROJECT%" (
    echo Project file not found: %PROJECT%
    exit /b 1
)

if not exist "%NUGET_CONFIG%" (
    echo NuGet.config not found: %NUGET_CONFIG%
    exit /b 1
)

if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

echo Restoring BrighterTools.Auth...
dotnet restore "%PROJECT%" --configfile "%NUGET_CONFIG%"
if errorlevel 1 exit /b %errorlevel%

echo Building BrighterTools.Auth...
dotnet build "%PROJECT%" -c %CONFIGURATION% --no-restore
if errorlevel 1 exit /b %errorlevel%

echo Packing BrighterTools.Auth package...
if "%VERSION%"=="" (
    dotnet pack "%PROJECT%" -c %CONFIGURATION% --no-build --output "%OUTPUT_DIR%" --configfile "%NUGET_CONFIG%"
) else (
    dotnet pack "%PROJECT%" -c %CONFIGURATION% --no-build --output "%OUTPUT_DIR%" --configfile "%NUGET_CONFIG%" /p:Version=%VERSION%
)
if errorlevel 1 exit /b %errorlevel%

echo.
echo Package output:
echo   %OUTPUT_DIR%
echo.
echo Publish command:
if "%VERSION%"=="" (
    echo   Use the GitHub Actions publish-tool workflow with Trusted Publishing to publish "%OUTPUT_DIR%\BrighterTools.Auth.*.nupkg" to nuget.org.
) else (
    echo   Use the GitHub Actions publish-tool workflow with Trusted Publishing to publish "%OUTPUT_DIR%\BrighterTools.Auth.%VERSION%.nupkg" to nuget.org.
)

endlocal
