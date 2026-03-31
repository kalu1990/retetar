# ============================================================
#  BUILD RELEASE - Bucataria Mea
#  Rulat din: C:\Retetar\retetar\primareteta\
# ============================================================

$ROOT           = "C:\Retetar\retetar\primareteta"
$DB             = "$ROOT\data\retetar.db"
$DB_BACKUP      = "$ROOT\data\retetar_backup_$(Get-Date -Format 'yyyyMMdd_HHmm').db"
$DIST           = "$ROOT\dist"
$DIST_EL        = "$ROOT\dist-electron"
$API            = "$ROOT\retetar_api.py"
$PYCACHE        = "$ROOT\__pycache__"
$PYTHON_EMBED   = "$ROOT\python-embed"
$PYTHON_EXE     = "$PYTHON_EMBED\python.exe"
$INSTALLER_NSH  = "$ROOT\installer.nsh"
$MAIN_JS        = "$ROOT\electron\main.js"
$RELEASE_DIR    = "$ROOT\Release"
$LOG_DIR        = "$ROOT\build_logs"
$LOG_FILE       = "$LOG_DIR\build_$(Get-Date -Format 'yyyyMMdd_HHmm').log"

$ErrorActionPreference = "Stop"
$startTime = Get-Date
$warnings  = @()

# ------------------------------------------------------------
# Helper: scrie si in consola si in log
# ------------------------------------------------------------
function Log {
    param([string]$msg, [string]$color = "White")
    Write-Host $msg -ForegroundColor $color
    Add-Content -Path $LOG_FILE -Value $msg -Encoding UTF8
}
function Warn {
    param([string]$msg)
    Log "   [ATENTIE] $msg" "DarkYellow"
    $script:warnings += $msg
}

# Creeaza folderele necesare
foreach ($dir in @($LOG_DIR, $RELEASE_DIR)) {
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
}
Add-Content -Path $LOG_FILE -Value "=== BUILD START: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -Encoding UTF8

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   BUILD RELEASE - Bucataria Mea" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------
# 1. Verificari sistem (disc + RAM)
# ------------------------------------------------------------
Log "[1/14] Verificari sistem (disc + RAM)..." "Yellow"

# Spatiu disc
$drive = Split-Path -Qualifier $ROOT
$disk  = Get-PSDrive ($drive.TrimEnd(':')) -ErrorAction SilentlyContinue
if ($disk) {
    $freeGB = [math]::Round($disk.Free / 1GB, 2)
    if ($freeGB -lt 1) {
        Log "   [EROARE] Spatiu liber insuficient pe $drive : $freeGB GB (necesar minim 1 GB)!" "Red"
        exit 1
    } elseif ($freeGB -lt 2) {
        Warn "Spatiu disc scazut: $freeGB GB liber. Build-ul poate esua."
    } else {
        Log "   [OK] Spatiu disc: $freeGB GB liber." "Green"
    }
}

# RAM disponibil
$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
if ($os) {
    $freeRAM = [math]::Round($os.FreePhysicalMemory / 1MB, 1)
    if ($freeRAM -lt 500) {
        Warn "RAM disponibil scazut: $freeRAM MB. Build-ul poate fi lent sau poate esua."
    } else {
        Log "   [OK] RAM disponibil: $freeRAM MB." "Green"
    }
}

# ------------------------------------------------------------
# 2. Verificari fisiere esentiale
# ------------------------------------------------------------
Log "[2/14] Verificari fisiere esentiale..." "Yellow"

$errors = @()
if (-not (Test-Path $ROOT))                          { $errors += "Folderul proiect nu exista: $ROOT" }
if (-not (Test-Path $API))                           { $errors += "retetar_api.py nu exista!" }
if (-not (Test-Path "$ROOT\package.json"))           { $errors += "package.json nu exista!" }
if (-not (Test-Path $MAIN_JS))                       { $errors += "electron\main.js nu exista!" }
if (-not (Test-Path "$ROOT\electron\preload.js"))    { $errors += "electron\preload.js nu exista!" }
if (-not (Test-Path "$ROOT\electron\splash.html"))   { $errors += "electron\splash.html nu exista - fereastra splash va crapa!" }
if (-not (Test-Path "$ROOT\node_modules"))           { $errors += "node_modules lipsa - ruleaza 'npm install' mai intai!" }
if (-not (Test-Path $INSTALLER_NSH))                 { $errors += "installer.nsh nu exista - build NSIS va esua!" }
if (-not (Test-Path $PYTHON_EMBED))                  { $errors += "python-embed lipsa - aplicatia instalata nu va functiona!" }
if (-not (Test-Path $PYTHON_EXE))                    { $errors += "python-embed\python.exe nu exista!" }
if (-not (Test-Path "$ROOT\assets\icon.ico"))        { $errors += "assets\icon.ico lipsa - build-ul va esua!" }
if (-not (Test-Path "$ROOT\src\App.jsx"))            { $errors += "src\App.jsx nu exista!" }
if (-not (Test-Path "$ROOT\src\main.jsx"))           { $errors += "src\main.jsx nu exista!" }
if (-not (Test-Path "$ROOT\vite.config.js"))         { $errors += "vite.config.js nu exista!" }
if (-not (Test-Path "$ROOT\tailwind.config.js"))     { $errors += "tailwind.config.js nu exista!" }
if (-not (Test-Path "$ROOT\index.html"))             { $errors += "index.html nu exista!" }

# installer.nsh nu e gol
if ((Test-Path $INSTALLER_NSH) -and (Get-Item $INSTALLER_NSH).Length -lt 100) {
    $errors += "installer.nsh pare gol sau corupt!"
}

if ($errors.Count -gt 0) {
    foreach ($e in $errors) { Log "   [EROARE] $e" "Red" }
    Log "Build oprit - fisiere esentiale lipsa." "Red"
    exit 1
}
Log "   [OK] Toate fisierele esentiale exista." "Green"

# ------------------------------------------------------------
# 3. Verifica package.json - extraResources + script electron:build
# ------------------------------------------------------------
Log "[3/14] Verificare package.json (extraResources + scripturi)..." "Yellow"

$pkgPath = "$ROOT\package.json"
$pkgRaw  = Get-Content $pkgPath -Raw
$pkg     = $pkgRaw | ConvertFrom-Json
$version = $pkg.version

# Verifica scriptul electron:build
if ($pkg.scripts -and $pkg.scripts.'electron:build') {
    Log "   [OK] Script 'electron:build' prezent." "Green"
} else {
    Log "   [EROARE] Scriptul 'electron:build' lipseste din package.json!" "Red"
    exit 1
}

# Verifica extraResources
$extraResRaw = $pkgRaw | Select-String "extraResources" 
if ($extraResRaw) {
    Log "   [OK] extraResources definit in package.json." "Green"
    
    if ($pkgRaw -notmatch "retetar_api\.py") {
        Warn "retetar_api.py nu pare inclus in extraResources - backend-ul NU va fi copiat in .exe!"
    } else {
        Log "   [OK] retetar_api.py inclus in extraResources." "Green"
    }
    if ($pkgRaw -notmatch "python-embed") {
        Warn "python-embed nu pare inclus in extraResources - Python NU va fi copiat in .exe!"
    } else {
        Log "   [OK] python-embed inclus in extraResources." "Green"
    }
} else {
    Log "   [EROARE] extraResources lipseste din package.json - fisierele backend nu vor fi incluse in .exe!" "Red"
    exit 1
}

# ------------------------------------------------------------
# 4. Verifica main.js - referinte corecte
# ------------------------------------------------------------
Log "[4/14] Verificare electron\main.js..." "Yellow"

$mainContent = Get-Content $MAIN_JS -Raw
if ($mainContent -match "retetar_api\.py") {
    Log "   [OK] main.js referentiaza retetar_api.py." "Green"
} else {
    Warn "main.js nu referentiaza retetar_api.py - backend-ul poate sa nu porneasca!"
}
if ($mainContent -match "python-embed") {
    Log "   [OK] main.js referentiaza python-embed." "Green"
} else {
    Warn "main.js nu referentiaza python-embed - backend-ul poate sa nu porneasca dupa instalare!"
}
if ($mainContent -match "resourcesPath") {
    Log "   [OK] main.js foloseste resourcesPath (corect pentru productie)." "Green"
} else {
    Warn "main.js poate sa nu foloseasca resourcesPath - verifica dupa build."
}

# ------------------------------------------------------------
# 5. Verifica cheia Groq API
# ------------------------------------------------------------
Log "[5/14] Verificare cheie Groq API..." "Yellow"

$apiContent = Get-Content $API -Raw
if ($apiContent -match 'GROQ_API_KEY.*"(gsk_[A-Za-z0-9]+)"') {
    $groqKey = $Matches[1]
    if ($groqKey.Length -gt 20) {
        Log "   [OK] Groq API key prezenta ($($groqKey.Substring(0,8))...)." "Green"
    } else {
        Log "   [EROARE] Groq API key pare invalida (prea scurta)!" "Red"
        exit 1
    }
} else {
    Warn "Nu s-a putut verifica Groq API key. Verifica manual in retetar_api.py."
}

# ------------------------------------------------------------
# 6. Verifica pachete Python in python-embed
# ------------------------------------------------------------
Log "[6/14] Verificare pachete Python in python-embed..." "Yellow"

$embedLib   = "$PYTHON_EMBED\Lib\site-packages"
$checkPkgs  = @("fastapi", "uvicorn", "httpx", "dotenv", "starlette", "anyio")
$missingPkgs = @()

foreach ($pkg2 in $checkPkgs) {
    $found = (Test-Path "$embedLib\$pkg2") -or 
             (Get-ChildItem $embedLib -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "$pkg2*" })
    if (-not $found) { $missingPkgs += $pkg2 }
}

if ($missingPkgs.Count -gt 0) {
    Warn "Pachete posibil lipsa in python-embed: $($missingPkgs -join ', ') - aplicatia instalata poate sa nu functioneze!"
} else {
    Log "   [OK] Pachetele Python par complete." "Green"
}

# ------------------------------------------------------------
# 7. Verifica baza de date
# ------------------------------------------------------------
Log "[7/14] Verificare baza de date..." "Yellow"

if (Test-Path $DB) {
    $dbSize = (Get-Item $DB).Length
    if ($dbSize -lt 1000) {
        Warn "retetar.db pare prea mica ($dbSize bytes) - posibil corupta!"
    } else {
        $dbKB = [math]::Round($dbSize / 1KB, 1)
        Log "   [OK] retetar.db existenta si intacta ($dbKB KB)." "Green"
    }
} else {
    Warn "retetar.db nu exista - va fi creata la prima pornire."
}

# ------------------------------------------------------------
# 8. Verifica portul 8000 si opreste Python
# ------------------------------------------------------------
Log "[8/14] Verificare port 8000 si procese Python..." "Yellow"

$port8000 = netstat -ano 2>$null | Select-String ":8000"
if ($port8000) {
    Log "   [INFO] Portul 8000 ocupat - opresc..." "DarkYellow"
    Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Log "   [OK] Procese Python oprite." "Green"
} else {
    Log "   [OK] Portul 8000 liber." "Green"
}

# ------------------------------------------------------------
# 9. Backup DB + curata backup-uri vechi (max 3)
# ------------------------------------------------------------
Log "[9/14] Backup baza de date..." "Yellow"

if (Test-Path $DB) {
    Copy-Item $DB $DB_BACKUP
    Log "   [OK] Backup creat: $(Split-Path $DB_BACKUP -Leaf)" "Green"

    $allBackups = Get-ChildItem "$ROOT\data\retetar_backup_*.db" | Sort-Object LastWriteTime -Descending
    if ($allBackups.Count -gt 3) {
        foreach ($f in ($allBackups | Select-Object -Skip 3)) {
            Remove-Item $f.FullName -Force
            Log "   [OK] Backup vechi sters: $($f.Name)" "DarkGray"
        }
    }
} else {
    Log "   [ATENTIE] retetar.db nu exista, sar peste backup." "DarkYellow"
}

# ------------------------------------------------------------
# 10. Curatare __pycache__, dist/, dist-electron/ + log-uri vechi
# ------------------------------------------------------------
Log "[10/14] Curatare fisiere vechi..." "Yellow"

if (Test-Path $PYCACHE) { Remove-Item $PYCACHE -Recurse -Force; Log "   [OK] __pycache__ sters." "Green" }
if (Test-Path $DIST)    { Remove-Item $DIST -Recurse -Force;    Log "   [OK] dist\ sters." "Green" }
if (Test-Path $DIST_EL) { Remove-Item $DIST_EL -Recurse -Force; Log "   [OK] dist-electron\ sters." "Green" }

# Pastreaza doar ultimele 5 log-uri
$allLogs = Get-ChildItem "$LOG_DIR\build_*.log" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($allLogs.Count -gt 5) {
    foreach ($f in ($allLogs | Select-Object -Skip 5)) {
        Remove-Item $f.FullName -Force
        Log "   [OK] Log vechi sters: $($f.Name)" "DarkGray"
    }
}

# ------------------------------------------------------------
# 11. Versiune + optiune increment
# ------------------------------------------------------------
Log "[11/14] Versiune aplicatie..." "Yellow"

Write-Host ""
Write-Host "   Versiunea curenta: $version" -ForegroundColor White
Write-Host "   Incrementezi versiunea patch? (ex: 1.0.9 -> 1.0.10)" -ForegroundColor White
Write-Host "   [Y] Da   [N] Nu (pastreaza $version)" -ForegroundColor DarkGray
Write-Host ""
$resp = Read-Host "   Raspuns"

if ($resp -eq "Y" -or $resp -eq "y") {
    $parts    = $version.Split(".")
    $parts[2] = [string]([int]$parts[2] + 1)
    $newVersion = $parts -join "."
    $pkgRaw2  = Get-Content $pkgPath -Raw
    $pkgRaw2  = $pkgRaw2 -replace '"version":\s*"[^"]+"', "`"version`": `"$newVersion`""
    Set-Content $pkgPath $pkgRaw2 -Encoding UTF8
    $version  = $newVersion
    Log "   [OK] Versiune incrementata la: $version" "Green"
} else {
    Log "   [OK] Versiune pastrata: $version" "Green"
}

# ------------------------------------------------------------
# 12. Build Electron
# ------------------------------------------------------------
Log "[12/14] Pornesc build Electron (versiunea $version)..." "Yellow"
Log "" "White"

Set-Location $ROOT
npm run electron:build 2>&1 | Tee-Object -Append -FilePath $LOG_FILE

if ($LASTEXITCODE -ne 0) {
    Log "" "White"
    Log "[EROARE] Build esuat! Verifica erorile de mai sus." "Red"
    Log "Log complet: $LOG_FILE" "DarkGray"
    exit 1
}

# ------------------------------------------------------------
# 13. Verifica installer + copiaza in Release/
# ------------------------------------------------------------
Log "" "White"
Log "[13/14] Verificare installer si copiere in Release..." "Yellow"

$installer = Get-ChildItem "$DIST_EL\*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $installer) {
    Log "[EROARE] Installer-ul .exe nu a fost gasit in dist-electron\!" "Red"
    exit 1
}

$sizeMB      = [math]::Round($installer.Length / 1MB, 1)
$releaseDest = "$RELEASE_DIR\$($installer.Name)"
Copy-Item $installer.FullName $releaseDest -Force
Log "   [OK] Installer copiat in Release\$($installer.Name)" "Green"
Log "   [OK] Marime: $sizeMB MB" "Green"

# Verifica marimea - un .exe prea mic e suspect
if ($installer.Length -lt 10MB) {
    Warn "Installer-ul pare prea mic ($sizeMB MB) - posibil lipsesc fisiere bundled!"
}

# ------------------------------------------------------------
# 14. Test API rapid
# ------------------------------------------------------------
Log "[14/14] Test rapid API backend..." "Yellow"

$apiProc = $null
try {
    $apiProc = Start-Process -FilePath $PYTHON_EXE -ArgumentList $API -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 4

    $apiOk = $false
    foreach ($url in @("http://localhost:8000/api/health", "http://localhost:8000/docs", "http://localhost:8000/")) {
        try {
            $r = Invoke-WebRequest -Uri $url -TimeoutSec 5 -ErrorAction Stop
            if ($r.StatusCode -lt 400) {
                Log "   [OK] API raspunde corect ($url)." "Green"
                $apiOk = $true
                break
            }
        } catch { }
    }
    if (-not $apiOk) {
        Warn "API-ul nu a raspuns in timp util. Verifica manual dupa instalare."
    }
} finally {
    if ($apiProc -and -not $apiProc.HasExited) {
        Stop-Process -Id $apiProc.Id -Force -ErrorAction SilentlyContinue
        Log "   [OK] Backend de test oprit." "DarkGray"
    }
}

# ------------------------------------------------------------
# SUMAR FINAL
# ------------------------------------------------------------
$endTime     = Get-Date
$duration    = [math]::Round(($endTime - $startTime).TotalSeconds, 0)
$backupCount = (Get-ChildItem "$ROOT\data\retetar_backup_*.db" -ErrorAction SilentlyContinue).Count

Log "" "White"
Log "============================================" "Green"
Log "   BUILD FINALIZAT CU SUCCES!" "Green"
Log "============================================" "Green"
Log "" "White"
Log "   INSTALLER" "Cyan"
Log "   Nume      : $($installer.Name)" "White"
Log "   Versiune  : $version" "White"
Log "   Marime    : $sizeMB MB" "White"
Log "   dist-el   : $DIST_EL\" "White"
Log "   Release   : $RELEASE_DIR\" "White"
Log "" "White"
Log "   PROIECT" "Cyan"
Log "   Sursa     : $ROOT" "White"
Log "   API       : $API" "White"
Log "   DB        : $DB" "White"
Log "   Backups   : $backupCount fisier(e) in data\" "White"
Log "   Python    : $PYTHON_EMBED" "White"
Log "" "White"
Log "   BUILD" "Cyan"
Log "   Durata    : $duration secunde" "White"
Log "   Log       : $LOG_FILE" "White"

if ($warnings.Count -gt 0) {
    Log "" "White"
    Log "   ATENTIONARI ($($warnings.Count)):" "DarkYellow"
    foreach ($w in $warnings) { Log "   ! $w" "DarkYellow" }
}

Log "" "White"
Log "============================================" "Green"
Log "" "White"

Add-Content -Path $LOG_FILE -Value "=== BUILD END: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - Durata: $duration sec - Warnings: $($warnings.Count) ===" -Encoding UTF8

# Deschide folderul Release
Start-Process explorer.exe $RELEASE_DIR
