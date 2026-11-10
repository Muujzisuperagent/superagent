param([Parameter(Mandatory=$true)][string]$RequestPath)
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false)
try {
 $r=Get-Content -LiteralPath $RequestPath -Raw -Encoding UTF8|ConvertFrom-Json
 $ne=New-Object -ComObject NoteExpress.NEHost2
 $libs=$ne.Libraries
 function Pack($p,$lib,$folder) {
  [pscustomobject]@{uid=$p.UID;id=$p.ID;library=$lib.FileName;libraryUid=$lib.UID;folder=$folder;title=$p.Values('Title');abstract=$p.Values('Abstract');authors=$p.Values('Author');year=$p.Values('Year');doi=$p.Values('DOI');attachments=$p.AttachmentFiles}
 }
 $folders=[System.Collections.Generic.List[object]]::new()
 $papers=[System.Collections.Generic.List[object]]::new()
 for($i=0;$i -lt $libs.Count;$i++) {
  $lib=$libs.Item($i)
  if($r.libraryUid -and $r.libraryUid -ne $lib.UID){continue}
  $queue=[System.Collections.Generic.Queue[object]]::new();$queue.Enqueue(@{f=$lib.References;path=''})
  $seen=[System.Collections.Generic.HashSet[string]]::new()
  while($queue.Count -gt 0){
   $entry=$queue.Dequeue();$f=$entry.f;$path=if($entry.path){$entry.path+'/'+$f.Title}else{$f.Title}
   if($folders.Count -ge 2000){throw 'Folder scan limit exceeded; narrow the library scope.'}
   $folders.Add([pscustomobject]@{uid=$f.UID;title=$f.Title;path=$path;libraryUid=$lib.UID;count=$f.Items.Count})
   for($j=0;$j -lt $f.Items.Count;$j++){
    $p=$f.Items.Items($j)
    if($seen.Add($p.UID)){$papers.Add((Pack $p $lib $path))}
    if($papers.Count -gt 20000){throw 'Reference scan limit exceeded.'}
   }
   for($j=0;$j -lt $f.Count;$j++){$queue.Enqueue(@{f=$f.Children($j);path=$path})}
  }
 }
 $selected=@();$s=$libs.SelectedItems
 for($i=0;$i -lt $s.Count;$i++){$selected+= $s.Items($i).UID}
 $active=$libs.ActiveFolder
 $result=@{connected=$true;activeFolder=$active.Title;activeLibrary=$active.ParentLibrary.FileName;activeLibraryUid=$active.ParentLibrary.UID;selectedUids=$selected;folders=@($folders.ToArray());papers=@($papers.ToArray());nativeNoteWrite=$false;nativeNoteReason='Native COM note content write is unavailable; local Markdown notes are used.'}
 $result|ConvertTo-Json -Depth 12 -Compress
} catch { @{error=$_.Exception.Message}|ConvertTo-Json -Compress;exit 1 }
