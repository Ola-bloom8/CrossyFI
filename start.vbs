Dim shell
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell -NoProfile -ExecutionPolicy Bypass -NoExit -Command ""Set-Location 'C:\Users\notua\Projects\postcard\frontend'; npm install; npm run dev"""
Set shell = Nothing
