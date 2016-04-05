@echo.
@echo For converting Git symlink files to Windows file symlinks.
@echo    * Run in repository root as Administrator.
@echo    * Handling of folder symlinks is not implemented.
@echo    * Intended for windows versions Vista and above (Win 7,8)
@echo.
@echo    Thanks to: http://stackoverflow.com/a/5930443/1031870
@echo    v1.02 (c) 2015 Robert Benko (Quazistax), License: MIT
@echo.

@echo off
pushd "%~dp0"
setlocal EnableDelayedExpansion
call :raiseUACIfNotAdmin || exit /B 1
for /f "tokens=3,*" %%e in ('git ls-files -s ^| findstr /R /C:"^120000"') do (
     call :processFirstLine %%f
)
REM pause
goto :eof

:processFirstLine
@echo.
@echo FILE:    %1

dir "%~f1" | find "<SYMLINK>" >NUL && (
  @echo FILE already is a symlink
  goto :eof
)

for /f "usebackq tokens=*" %%l in ("%~f1") do (
  @echo LINK TO: %%l
  
  del "%~f1"
  if not !ERRORLEVEL! == 0 (
    @echo FAILED: del
    goto :eof
  )

  setlocal
  call :expandRelative linkto "%1" "%%l"
  mklink "%~f1" "!linkto!"
  endlocal
  if not !ERRORLEVEL! == 0 (
    @echo FAILED: mklink
    @echo reverting deletion...
    git checkout -- "%~f1"
    goto :eof
  )

  git update-index --assume-unchanged "%1"
  if not !ERRORLEVEL! == 0 (
    @echo FAILED: git update-index --assume-unchanged
    goto :eof
  )
  @echo SUCCESS
  goto :eof
)
goto :eof

:: param1 = result variable
:: param2 = reference path from which relative will be resolved
:: param3 = relative path
:expandRelative
  pushd .
  cd "%~dp2"
  set %1=%~f3
  popd
goto :eof

:raiseUACIfNotAdmin
:: Quick test for Windows generation: UAC aware or not ; all OS before NT4 ignored for simplicity
:: Original from: http://stackoverflow.com/a/14729312/1031870

(ver | findstr /IL "5." > NUL  || ver | findstr /IL "4." > NUL) && (
  @echo ERROR: Symlinks are not supported on this version of Windows.
  exit /B 1
)

:: Test if Admin
call net session >NUL 2>&1
if not !ERRORLEVEL! == 0 (
  :: Start batch again with UAC
  echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
  echo UAC.ShellExecute "cmd.exe", "/K ""cd /d %~dp0 && %~s0""", "%~dp0", "runas", 1 >> "%temp%\getadmin.vbs"
  @echo Requesting administrative privileges...
  "%temp%\getadmin.vbs"
  del "%temp%\getadmin.vbs"
  exit /B 2
)
exit /B 0
goto :eof
