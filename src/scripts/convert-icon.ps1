Param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [Parameter(Mandatory = $true)]
    [string]$DestinationPath,

    [Parameter()]
    [int]$Size = 192
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $SourcePath)) {
    Write-Error "Source file not found: $SourcePath"
    exit 1
}

$img = [System.Drawing.Image]::FromFile($SourcePath)

if ($img.Width -eq $Size -and $img.Height -eq $Size) {
    $img.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $img.Dispose()
    Write-Output "Saved existing $Size x $Size image to $DestinationPath"
    exit 0
}

$bmp = New-Object System.Drawing.Bitmap $Size, $Size
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.DrawImage($img, 0, 0, $Size, $Size)
$graphics.Dispose()
$img.Dispose()
$bmp.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Converted image to $Size x $Size and saved to $DestinationPath"

