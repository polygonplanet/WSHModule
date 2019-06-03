unit WSHModuleConsole;

{$i WSHModule.inc}

interface

uses
  Windows,
  Messages,
  Classes,
  SysUtils,
  FileUtil,
  Forms,
  Controls,
  Graphics,
  Dialogs,
  StdCtrls,
  LazUTF8,
  Clipbrd,
  Process,
  LazUtils,
  LConvEncoding,
  lclproc,
  superdate in './vendors/superdate.pas',
  supertypes in './vendors/supertypes.pas',
  superobject in './vendors/superobject.pas',
  WSHModuleUtils,
  WSHModuleScript;


const
  WM_WSHMODULE_COMMAND = WM_APP + 10;


type
  // Messages to share command with parent application
  // fpc is not supported WM_COPYDATA
  PWSHModuleCommandData = ^TWSHModuleCommandData;
  TWSHModuleCommandData = record
    Command: String;
    FileName: String;
    Handle: THandle;
    Data: String;
  end;

  TWSHModuleCommand = (
    wcGetTextClip,
    wcSetTextClip,
    wcEmptyClip,
    wcGetHTMLClip,
    wcSetHTMLClip,
    wcConsoleLog,
    wcAlert,
    wcConfirm,
    wcPrompt,
    wcTmpfile,
    wcToDefaultEncoding,
    wcUnknown
  );

  { -- TWSHModuleConsoleForm -- }
  TWSHModuleConsoleForm = class(TForm)
    Console: TMemo;

    procedure FormCreate(Sender: TObject);

    procedure GetTextClip(WCD: TWSHModuleCommandData);
    procedure SetTextClip(WCD: TWSHModuleCommandData);
    procedure EmptyClip(WCD: TWSHModuleCommandData);
    procedure GetHTMLClip(WCD: TWSHModuleCommandData);
    procedure SetHTMLClip(WCD: TWSHModuleCommandData);
    procedure ConsoleLog(WCD: TWSHModuleCommandData);
    procedure CommandAlert(WCD: TWSHModuleCommandData);
    procedure CommandConfirm(WCD: TWSHModuleCommandData);
    procedure CommandPrompt(WCD: TWSHModuleCommandData);
    procedure AddTmpFileName(WCD: TWSHModuleCommandData);
    procedure ToDefaultEncoding(WCD: TWSHModuleCommandData);

    procedure RunScript(WCD: TWSHModuleCommandData);
    procedure ExecuteScriptThread;
    procedure OnScriptTerminate;
    procedure ExecuteScriptCommand;
    procedure ProcessCommandParams;
    procedure ExecuteCommand(WCD: TWSHModuleCommandData);

    procedure FormShow(Sender: TObject);
    procedure FormHide(Sender: TObject);
    procedure FormClose(Sender: TObject; var CloseAction: TCloseAction);
    procedure FormCloseQuery(Sender: TObject; var CanClose: boolean);
    procedure FormDestroy(Sender: TObject);
  private
    FAppId: String;
    FWSHModuleScript: TWSHModuleScript;
    FScriptFile: String;
    FAppPath: String;
    FAppDir: String;
    FTmpDir: String;
    FWSHEngine: String;
    FDoTerminate: Boolean;
    FTmpFileNames: TStringList;
    FIsScriptClosed: Boolean;
    FIsConsoleLogged: Boolean;

    function ApplyCommand: Boolean;
    function ParseCommandFile(FileName: String): TWSHModuleCommandData;
    function StringToCommand(Command: String): TWSHModuleCommand;
    function CommandToString(Command: TWSHModuleCommand): String;
    function GetTmpfileName(Command: String): String;
    function CheckParameter(WCD: TWSHModuleCommandData;
                            CheckExists: Boolean = False;
                            Silent: Boolean = False): Boolean;
    procedure SetConsoleEditable(Editable: Boolean = True);
    procedure MoveToConsoleLastLine;
    procedure AddConsoleText(S: String);
    procedure AppendConsoleSeparator;
    procedure OnQueryEndSession(var Cancel: Boolean);
    procedure OnWMCommandMessage(Command: TWSHModuleCommand);
  public
    property WSHModuleScript: TWSHModuleScript read FWSHModuleScript write FWSHModuleScript;
    property DoTerminate: Boolean read FDoTerminate write FDoTerminate;
  end;


var
  WSHModuleConsoleForm: TWSHModuleConsoleForm;
  PrevWndProc: WNDPROC;


implementation


{$R *.lfm}


const
  CR = #$0D;
  LF = #$0A;
  WCD_SIGNATURE = 262;
  CONSOLE_MAX_LINE = 5000;
  WSHMODULE_SCRIPTNAME = 'wshmodule.wsf';
  WSHMODULE_SHELLNAME = 'wshmshell.js';


// Window procedure for get window message (WM_xxx)
function WndCallback(H: HWND; Msg: UINT; W: WParam; L: LParam): LRESULT; stdcall;
begin
  if Msg = WM_WSHMODULE_COMMAND then
  begin
    WSHModuleConsoleForm.OnWMCommandMessage(TWSHModuleCommand(L));
  end;
  Result := CallWindowProc(PrevWndProc, H, Msg, W, L);
end;


procedure TWSHModuleConsoleForm.FormCreate(Sender: TObject);
{$ifdef WSHModuleDebug}
var Path: String;
{$endif}

begin
  FDoTerminate := False;
  try
    if ApplyCommand then
      FDoTerminate := True
    else
    begin
      PrevWndProc := Windows.WNDPROC(SetWindowLongPtr(Self.Handle,
                                                      GWL_WNDPROC,
                                                      PtrInt(@WndCallback)));

      Visible := False;
      SetTopMostFocusWindow(Self, False);

      FAppId := GetRandomAlphanum(8);
      FWSHEngine := 'wscript';
      FWSHModuleScript := nil;
      FIsScriptClosed := False;
      FIsConsoleLogged := False;
      FTmpFileNames := TStringList.Create;

      FAppPath := Application.ExeName;
      FAppDir := ExcludeTrailingPathDelimiter(ExtractFilePath(FAppPath));
      FTmpDir := ExcludeTrailingPathDelimiter(GetTmpDir);

      {$ifdef WSHModuleDebug}
        Path := IncludeTrailingPathDelimiter(FTmpDir) + WSHMODULE_SCRIPTNAME;
        SaveToFileAsUTF8(Path, Path);
        Assert(LoadFromFileAsUTF8(Path) = Path);
        DeleteFile(Path);
        Assert(not FileExists(Path));
        FTmpDir := FAppDir;
      {$endif}

      Console.Lines.Delimiter := LF;
      SetScreenCenter(Self);
      Application.OnQueryEndSession := Self.OnQueryEndSession;
      ProcessCommandParams;
    end;
  finally
    if FDoTerminate then
      Application.Terminate;
  end;
end;


function TWSHModuleConsoleForm.ApplyCommand: Boolean;
var
  FileName: String;
  WCD: TWSHModuleCommandData;
  Command: TWSHModuleCommand;
begin
  Result := False;

  if (CreateMutex(nil, False, 'WSHModuleMutex') <> 0) and
     (GetLastError = ERROR_ALREADY_EXISTS) then
  begin
    Result := True;

    if ParamCount = 0 then
      Exit;

    FileName := ParamStr(1);

    WCD := ParseCommandFile(FileName);

    if Length(WCD.FileName) = 0 then
      Exit;

    Command := StringToCommand(WCD.Command);

    // Send commandline parameters to parent window
    SendMessage(WCD.Handle, WM_WSHMODULE_COMMAND, 0, LPARAM(Command));
  end;
end;


function TWSHModuleConsoleForm.ParseCommandFile(FileName: String): TWSHModuleCommandData;
var
  Content: String;
  Win: THandle;
  Signature: Integer;
  Data: ISuperObject;
begin
  Result.Command := '';
  Result.FileName := '';

  Content := LoadFromFileAsUTF8(FileName);
  try
    Data := SO(Content);
    Signature := Data.AsObject.I['signature'];

    if Signature <> WCD_SIGNATURE then
    begin
      Alert(Format('Invalid signature: %d', [Signature]));
      FDoTerminate := True;
      Exit;
    end;

    Win := THandle(Data.AsObject.I['handle']);
    if (Win = 0) or (not IsWindow(Win)) then
    begin
      Alert(Format('Invalid handle: %d', [Win]));
      FDoTerminate := True;
      Exit;
    end;

    Result.Command := Data.AsObject.S['command'];
    Result.FileName := FileName;
    Result.Handle := Win;
    Result.Data := UTF16ToUTF8(Data.AsObject.S['data']);
  finally
    Data := nil;
  end;
end;


function TWSHModuleConsoleForm.StringToCommand(Command: String): TWSHModuleCommand;
var
  Cmd: String;
begin
  Cmd := LowerCase(Command);

  if Cmd = 'consolelog'             then Result := wcConsoleLog
  else if Cmd = 'gettextclip'       then Result := wcGetTextClip
  else if Cmd = 'settextclip'       then Result := wcSetTextClip
  else if Cmd = 'emptyclip'         then Result := wcEmptyClip
  else if Cmd = 'gethtmlclip'       then Result := wcGetHTMLClip
  else if Cmd = 'sethtmlclip'       then Result := wcSetHTMLClip
  else if Cmd = 'alert'             then Result := wcAlert
  else if Cmd = 'confirm'           then Result := wcConfirm
  else if Cmd = 'prompt'            then Result := wcPrompt
  else if Cmd = 'tmpfile'           then Result := wcTmpfile
  else if Cmd = 'todefaultencoding' then Result := wcToDefaultEncoding
  else Result := wcUnknown;
end;


function TWSHModuleConsoleForm.CommandToString(Command: TWSHModuleCommand): String;
begin
  case Command of
  wcConsoleLog:        Result := 'consolelog';
  wcGetTextClip:       Result := 'gettextclip';
  wcSetTextClip:       Result := 'settextclip';
  wcEmptyClip:         Result := 'emptyclip';
  wcGetHTMLClip:       Result := 'gethtmlclip';
  wcSetHTMLClip:       Result := 'sethtmlclip';
  wcAlert:             Result := 'alert';
  wcConfirm:           Result := 'confirm';
  wcPrompt:            Result := 'prompt';
  wcTmpfile:           Result := 'tmpfile';
  wcToDefaultEncoding: Result := 'todefaultencoding';
  else                 Result := 'unknown'
  end;
end;


function TWSHModuleConsoleForm.GetTmpfileName(Command: String): String;
begin
  Result := Format('%s__WSHModule_%s_%s.json', [
    IncludeTrailingPathDelimiter(FTmpDir),
    FAppId,
    Command
  ]);
end;


// Add a temporary filename to delete on app shutdown
// because it's leakage when script calls WScript.Quit()
procedure TWSHModuleConsoleForm.AddTmpFileName(WCD: TWSHModuleCommandData);
var
  FileName: String;
  LocalName: String;
  LongName: String;
begin
  FileName := WCD.Data;

  if (FileName <> '') and (FTmpFileNames.IndexOf(WCD.FileName) = -1) then
  begin
    FTmpFileNames.Add(FileName);

    LocalName := ConvertEncoding(FileName, EncodingUTF8, GetDefaultTextEncoding);
    FTmpFileNames.Add(LocalName);

    LongName := GetLongName(FileName);
    if (Length(LongName) > 0) and (FileName <> LongName) then
      FTmpFileNames.Add(LongName);
  end;
end;


procedure TWSHModuleConsoleForm.GetTextClip(WCD: TWSHModuleCommandData);
var
  Data: ISuperObject;
  S: String;
begin
  if not CheckParameter(WCD) then
    Exit;

  Data := SO();
  try
    Data.AsObject.S['result'] := UTF8ToUTF16(Clipboard.AsText);
    SaveToFileAsUTF8(WCD.FileName, UTF16ToUTF8(Data.AsJSon()));
  finally
    Data := nil;
  end;
end;


procedure TWSHModuleConsoleForm.SetTextClip(WCD: TWSHModuleCommandData);
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Clipboard.AsText := WCD.Data;
end;


procedure TWSHModuleConsoleForm.EmptyClip(WCD: TWSHModuleCommandData);
begin
  TUniClipboard.Empty;
end;


procedure TWSHModuleConsoleForm.GetHTMLClip(WCD: TWSHModuleCommandData);
var
  Clip: TUniClipboard;
  Data: ISuperObject;
begin
  if not CheckParameter(WCD) then
    Exit;

  Data := SO();
  Clip := TUniClipboard.Create;
  try
    Data.AsObject.S['result'] := UTF8ToUTF16(Clip.AsHTML);
    SaveToFileAsUTF8(WCD.FileName, UTF16ToUTF8(Data.AsJSon()));
  finally
    Clip.Free;
    Data := nil;
  end;
end;


procedure TWSHModuleConsoleForm.SetHTMLClip(WCD: TWSHModuleCommandData);
var
  Clip: TUniClipboard;
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Clip := TUniClipboard.Create;
  try
    Clip.AsHTML := WCD.Data;
  finally
    Clip.Free;
  end;
end;


procedure TWSHModuleConsoleForm.ConsoleLog(WCD: TWSHModuleCommandData);
var
  Log: String;
begin
  if not CheckParameter(WCD, True) then
    Exit;

  if FWSHEngine <> 'wscript' then
    Exit;

  Log := WCD.Data;
  AppendConsoleSeparator;
  AddConsoleText(Log);
  MoveToConsoleLastLine;

  if not FIsConsoleLogged then
  begin
    FIsConsoleLogged := True;
    Visible := True;
    SetTopMostFocusWindow(Self);
  end;
end;


procedure TWSHModuleConsoleForm.CommandAlert(WCD: TWSHModuleCommandData);
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Alert(WCD.Data);
end;


procedure TWSHModuleConsoleForm.CommandConfirm(WCD: TWSHModuleCommandData);
var
  Data: ISuperObject;
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Data := SO();
  try
    Data.AsObject.B['result'] := Confirm(WCD.Data);
    SaveToFileAsUTF8(WCD.FileName, Data.AsJSon());
  finally
    Data := nil;
  end;
end;


procedure TWSHModuleConsoleForm.CommandPrompt(WCD: TWSHModuleCommandData);
var
  Title: String;
  Msg: String;
  Value: String;
  Res: Boolean;
  Param: ISuperObject;
  Data: ISuperObject;
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Data := SO();
  Param := SO(WCD.Data);
  try
    Title := Application.Title;
    Msg := Param.AsObject.S['msg'];
    Value := Param.AsObject.S['defaultValue'];

    Res := InputQuery(Title, Msg, False, Value);

    Data.AsObject.B['result'] := Res;
    Data.AsObject.S['value'] := Value;

    SaveToFileAsUTF8(WCD.FileName, Data.AsJSon());
  finally
    Param := nil;
    Data := nil;
  end;
end;


procedure TWSHModuleConsoleForm.ToDefaultEncoding(WCD: TWSHModuleCommandData);
var
 Data: ISuperObject;

  procedure StringToCharCode(S: String);
  var
    C, I, Len: Integer;
    Code: TSuperArray;
    Value: String;
  begin
    Value := '';
    Data.AsObject.O['code'] := TSuperObject.Create(stArray);
    Code := Data.AsObject['code'].AsArray;
    I := 1;
    Len := Length(S) + 1;
    while I < Len do
    begin
      C := Ord(S[I]);
      Value :=  Value + '\u' + IntToHex(C, 4);
      Code.I[I - 1] := C;
      Inc(I);
    end;
    Data.AsObject.S['value'] := Value;
  end;

var
  Res: String;
  Value: String;
  Encoded: String;
  Param: ISuperObject;
begin
  if not CheckParameter(WCD, True) then
    Exit;

  Param := SO(WCD.Data);
  Data := SO();
  try
    Value := Param.AsObject.S['value'];
    Encoded := ConvertEncoding(Value, EncodingUTF8, GetDefaultTextEncoding);
    StringToCharCode(Encoded);
    Res := StringReplace(Data.AsJSon(), '\\', '\', [rfReplaceAll]);
    SaveToFileAsUTF8(WCD.FileName, Res);
  finally
    Param := nil;
    Data := nil;
  end;
end;


function TWSHModuleConsoleForm.CheckParameter(WCD: TWSHModuleCommandData;
                                              CheckExists: Boolean = False;
                                              Silent: Boolean = False): Boolean;
begin
  if CheckExists then
    Result := FileExists(WCD.FileName)
  else
    Result := (WCD.FileName <> '');

  if not Result then
  begin
    FDoTerminate := True;
    if not Silent then
      Alert(Format('No such file "%s"', [WCD.FileName]));
  end;
end;


procedure TWSHModuleConsoleForm.RunScript(WCD: TWSHModuleCommandData);
begin
  FDoTerminate := False;
  FScriptFile := WCD.FileName;
  ExecuteScriptThread;
end;


procedure TWSHModuleConsoleForm.ExecuteScriptThread;
var
  WCD: TWSHModuleCommandData;
begin
  WCD.FileName := FScriptFile;

  if not CheckParameter(WCD, True) then
    Exit;

  FWSHModuleScript := TWSHModuleScript.Create;
  FWSHModuleScript.OnExecute := Self.ExecuteScriptCommand;
  FWSHModuleScript.OnTerminate := Self.OnScriptTerminate;
  FWSHModuleScript.Execute;
end;


procedure TWSHModuleConsoleForm.OnScriptTerminate;
begin
  FWSHModuleScript.Free;

  if not Visible then
  begin
    FDoTerminate := True;
    Application.Terminate;
  end
  else
  begin
    FDoTerminate := True;
    FIsScriptClosed := True;

    //XXX: Notice that the script thread is closed
    AddConsoleText('Script thread closed.');
    MoveToConsoleLastLine;
    SetConsoleEditable(False);
  end;
end;


procedure TWSHModuleConsoleForm.ExecuteScriptCommand;
var
  WSHModuleFile: String;
  Command: String;
  Process: TProcess;
begin
  WSHModuleFile := IncludeTrailingPathDelimiter(FAppDir) + WSHMODULE_SCRIPTNAME;

  Process := TProcess.Create(nil);
  try
    Process.CommandLine := Format(
      'wscript.exe //nologo "%s" "%s" "%s" "%d" "%s"', [
      WSHModuleFile,
      FScriptFile,
      FAppId,
      //XXX: FindWindow is not working in fpc mode=delphi
      // Posts the application handle to script.
      Self.Handle,
      FWSHEngine
    ]);

    Process.Options := [poWaitOnExit];
    Process.Execute;

    while Process.Running do
    begin
      Application.ProcessMessages;
      Sleep(30);
    end;
  finally
    FWSHModuleScript := nil;
    Process.Free;
  end;
end;


procedure TWSHModuleConsoleForm.ProcessCommandParams;
var
  Command: String;
  FileName: String;
  WCD: TWSHModuleCommandData;
begin
  if ParamCount = 0 then
  begin
    FWSHEngine := 'cscript';
    WCD.Command := 'runscript';
    WCD.FileName := IncludeTrailingPathDelimiter(FAppDir) + WSHMODULE_SHELLNAME;
  end
  else
  begin
    WCD.FileName := '';
    WCD.Command := 'unknown';

    if (ParamCount = 1) then
    begin
      Command := LowerCase(ParamStr(1));
      if (Pos('/', Command) <> 1) and (Pos('.', Command) > 0) then
      begin
        WCD.Command := 'runscript';
        WCD.FileName := ParamStr(1);
      end
      else
      begin
        Alert(Format('Invalid command: "%s"', [Command]));
        FDoTerminate := True;
      end;
    end
    else
    begin
      FileName := ParamStr(2);
      WCD := ParseCommandFile(FileName);
    end;
  end;

  if Length(WCD.FileName) = 0 then
    FDoTerminate := True;

  if not FDoTerminate then
    ExecuteCommand(WCD);
end;


procedure TWSHModuleConsoleForm.ExecuteCommand(WCD: TWSHModuleCommandData);
var
  Cmd: String;
begin
  Cmd := LowerCase(WCD.Command);

  if Cmd = 'consolelog' then
  begin
    ConsoleLog(WCD);
  end
  else if Cmd = 'gettextclip' then
  begin
    GetTextClip(WCD);
  end
  else if Cmd = 'settextclip' then
  begin
    SetTextClip(WCD);
  end
  else if Cmd = 'emptyclip' then
  begin
    EmptyClip(WCD);
  end
  else if Cmd = 'gethtmlclip' then
  begin
    GetHTMLClip(WCD);
  end
  else if Cmd = 'sethtmlclip' then
  begin
    SetHTMLClip(WCD);
  end
  else if Cmd = 'alert' then
  begin
    CommandAlert(WCD);
  end
  else if Cmd = 'confirm' then
  begin
    CommandConfirm(WCD);
  end
  else if Cmd = 'prompt' then
  begin
    CommandPrompt(WCD);
  end
  else if Cmd = 'tmpfile' then
  begin
    AddTmpFileName(WCD);
  end
  else if Cmd = 'todefaultencoding' then
  begin
    ToDefaultEncoding(WCD);
  end
  else if (Cmd = 'runscript') or (Cmd = '') then
  begin
    RunScript(WCD);
  end
  else
  begin
    Alert(Format('Unknown command "%s"', [Cmd]));
    FDoTerminate := True;
  end;
end;


procedure TWSHModuleConsoleForm.SetConsoleEditable(Editable: Boolean = True);
begin
  if (not FIsScriptClosed) and Editable then
  begin
    Console.Font.Color := clWhite;
    Console.ReadOnly := False;
  end
  else
  begin
    Console.Font.Color := clSilver;
    Console.ReadOnly := True;
  end;
end;


procedure TWSHModuleConsoleForm.MoveToConsoleLastLine;
begin
  Console.SelStart := Length(Console.Lines.Text);
  Console.Perform(EM_SCROLLCARET, 0, 0);
end;


procedure TWSHModuleConsoleForm.AddConsoleText(S: String);
begin
  if FWSHEngine <> 'wscript' then
    Exit;

  Console.Lines.BeginUpdate;
  try
    //XXX: MaxLength
    if Console.Lines.Count = 0 then
    begin
      Console.Lines.Text := S;
    end
    else
    begin
      Console.Lines.Text := Console.Lines.Text + LF + S;
    end;
  finally
    Console.Lines.EndUpdate;
  end;
end;


procedure TWSHModuleConsoleForm.AppendConsoleSeparator;
var
  T: String;
begin
  T := FormatDateTime('-- hh:nn:ss.z --', Now);
  AddConsoleText(T);
end;


procedure TWSHModuleConsoleForm.OnQueryEndSession(var Cancel: Boolean);
begin
  FDoTerminate := True;
  WSHModuleConsoleForm.DoTerminate := True;
  Cancel := False;
  //TODO: windows shutdown
  Application.Terminate;
end;


procedure TWSHModuleConsoleForm.OnWMCommandMessage(Command: TWSHModuleCommand);
var
  FileName: String;
  WCD: TWSHModuleCommandData;
begin
  FileName := GetTmpfileName(CommandToString(Command));

  if not FileExists(FileName) then
  begin
    Alert(Format('No such file "%s"', [FileName]));
    FDoTerminate := True;
    Exit;
  end;

  WCD := ParseCommandFile(FileName);

  if Length(WCD.FileName) = 0 then
  begin
    FDoTerminate := True;
    Exit;
  end;

  if not FDoTerminate then
    ExecuteCommand(WCD)
  else
    Application.Terminate;
end;


procedure TWSHModuleConsoleForm.FormShow(Sender: TObject);
begin
  SetTaskbarVisible(Self, True);
end;


procedure TWSHModuleConsoleForm.FormHide(Sender: TObject);
begin
  SetTaskbarVisible(Self, False);
end;


procedure TWSHModuleConsoleForm.FormClose(Sender: TObject; var CloseAction: TCloseAction);
begin
  if (not FDoTerminate) and Visible then
  begin
    SetTopMostFocusWindow(Self, False);
    Visible := False;
  end;
end;


procedure TWSHModuleConsoleForm.FormCloseQuery(Sender: TObject; var CanClose: boolean);
begin
  if (not FDoTerminate) and (Sender = WSHModuleConsoleForm) then
  begin
    CanClose := False;

    if WSHModuleConsoleForm.Visible then
    begin
      SetTopMostFocusWindow(WSHModuleConsoleForm, False);
      WSHModuleConsoleForm.Visible := False;
    end;
  end;

  if FDoTerminate then
    CanClose := True;
end;


procedure TWSHModuleConsoleForm.FormDestroy(Sender: TObject);
var
  I: Integer;
begin
  try
    if FWSHModuleScript <> nil then
    begin
      FWSHModuleScript.OnTerminate := nil;
      FWSHModuleScript.OnExecute := nil;
      FWSHModuleScript := nil;
    end;
    Assert(FWSHModuleScript = nil);

    // Delete tmporary script files
    for I := 0 to FTmpFileNames.Count - 1 do
    begin
      SilentDeleteFile(FTmpFileNames[I]);
    end;
  finally
    FTmpFileNames.Free;
  end;
end;

end.

