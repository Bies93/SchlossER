# Offline studio master. Render the dialogue once, not on the player's device.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$scratch = New-Item -Type Directory -Path (Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid()))
$line = 'Fürchte nicht die Stille. Noch ehe der erste Stein fiel, kannte ich deinen Namen. Tritt ins Licht.'
try {
  foreach ($role in @(@('Microsoft Stefan','lead'),@('Microsoft Hedda Desktop','shadow'))) {
    $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
    try {
      $voice.SelectVoice($role[0]); $voice.Rate = -2
      $voice.SetOutputToWaveFile((Join-Path $scratch.FullName ($role[1]+'.wav')))
      $voice.Speak($line)
    } finally { $voice.Dispose() }
  }
  python (Join-Path $PSScriptRoot 'mix-orb-voice.py') $scratch.FullName
  if ($LASTEXITCODE) { throw 'Audiomix fehlgeschlagen' }
} finally {
  foreach ($name in @('lead.wav','shadow.wav')) {
    $file = Join-Path $scratch.FullName $name
    if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file }
  }
  $scratch.Delete()
}
