# Render once to portable PCM; runtime playback is fully offline.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$tmp = New-Item -Type Directory -Path (Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid()))
$raw = Join-Path $tmp.FullName 'dry.wav'
try {
  $voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $de = $voice.GetInstalledVoices() | Where-Object {$_.Enabled -and $_.VoiceInfo.Culture.Name -match '^de'} | Sort-Object @{Expression={$_.VoiceInfo.Name -notmatch 'Stefan'}} | Select-Object -First 1
    if (!$de) {throw 'Keine lokale deutsche Stimme installiert'}
    $voice.SelectVoice($de.VoiceInfo.Name)
    $voice.Rate = -3
    $voice.SetOutputToWaveFile($raw)
    $speech = New-Object System.Speech.Synthesis.PromptBuilder
    $speech.AppendText('Deutschland')
    $speech.AppendBreak([TimeSpan]::FromMilliseconds(745))
    $speech.AppendText('Deutschland')
    $voice.Speak($speech)
  } finally { $voice.Dispose() }
  python (Join-Path $PSScriptRoot 'mix-prisoner-voice.py') $raw
  if ($LASTEXITCODE) {throw 'Stimmenmix fehlgeschlagen'}
} finally {
  if (Test-Path -LiteralPath $raw) { Remove-Item -LiteralPath $raw }
  $tmp.Delete()
}
