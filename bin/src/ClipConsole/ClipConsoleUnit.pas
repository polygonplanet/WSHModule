{
  ClipConsole: ClipConsoleUnit
}

unit ClipConsoleUnit;

interface


{$DEFINE PurePascalExecuteByteCode}
{$DEFINE UseSafeStringEquals}
{$DEFINE UseOptimizedHashing}
{$DEFINE UseAssert}
{$DEFINE UseSafeOperations}
{$DEFINE ForceUseSafeOperations}


uses
  Windows,
  Messages,
  SysUtils,
  Variants,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  StdCtrls,
  TntStdCtrls,
  UniClipboard;

type
  TClipConsoleForm = class(TForm)
    ClipConsoleShell: TTntMemo;
    procedure FormCreate(Sender: TObject);

    procedure SetTopMostFocusWindow(const Visible: Boolean = True);
    procedure SetScreenCenter;

    function WideStringToUTF8String(Src: WideString): UTF8String;
    function UTF8StringToWideString(Src: UTF8String): WideString;

    procedure SaveToFileAsUTF8(FileName: WideString; Data: WideString);
    function LoadFromFileAsUTF8(FileName: WideString): WideString;

    procedure ResolveCommand;
    procedure GetClip(const FileName: WideString);
    procedure SetClip(const FileName: WideString);
    procedure ConsoleLog(const FileName: WideString);
  private
    FCanClose: Boolean;
  public
    property CanClose: Boolean read FCanClose write FCanClose;
  end;


var
  ClipConsoleForm: TClipConsoleForm;

implementation

{$R *.dfm}

{*--------------------------------------------------------------------------*}
// WideString -> UTF-8String
function TClipConsoleForm.WideStringToUTF8String(Src: WideString): UTF8String;
var
  Len: Integer;
  Buff: PAnsiChar;
begin
  Len  := WideCharToMultiByte(CP_UTF8, 0, PWideChar(Src), -1, nil, 0, nil, nil);
  Buff := AllocMem(Len + 1);
  try
    WideCharToMultiByte(CP_UTF8, 0, PWideChar(Src), -1, Buff, Len +1, nil, nil);
    Result := UTF8String(Buff);
  finally
    FreeMem(Buff);
  end;
end;

// UTF-8String -> WideString
function TClipConsoleForm.UTF8StringToWideString(Src: UTF8String): WideString;
var
  Len: Integer;
  Buff: PWideChar;
begin
  Len := MultiByteToWideChar(CP_UTF8, 0, PAnsiChar(Src), -1, nil, 0);
  Buff := AllocMem((Len + 1) * 2);
  try
    MultiByteToWideChar(CP_UTF8, 0, PAnsiChar(Src), -1, Buff, Len);
    Result := WideString(Buff);
  finally
    FreeMem(Buff);
  end;
end;

{*---------------------------------------------------------------------------*}
procedure TClipConsoleForm.SaveToFileAsUTF8(FileName: WideString; Data: WideString);
var
  Stream: TFileStream;
  S: UTF8String;
begin
  S := WideStringToUTF8String(Data);
  Stream := TFileStream.Create(FileName, fmCreate);
  try
    Stream.WriteBuffer(Pointer(S)^, Length(S));
  finally
    Stream.Free;
  end;
end;


function TClipConsoleForm.LoadFromFileAsUTF8(FileName: WideString): WideString;
var
  Stream: TFileStream;
  S: UTF8String;
begin
  Result := '';
  Stream := TFileStream.Create(FileName, fmOpenRead);
  try
    SetLength(S, Stream.Size);
    Stream.Position := 0;
    Stream.ReadBuffer(Pointer(S)^, Stream.Size);
    Result := UTF8StringToWideString(S);
  finally
    Stream.Free;
  end;
end;

{*---------------------------------------------------------------------------*}
procedure TClipConsoleForm.SetTopMostFocusWindow(const Visible: Boolean = True);
begin
  if Visible then begin
    SetForegroundWindow(ClipConsoleForm.Handle);
    ClipConsoleForm.SetFocus;
  end;
end;

{*---------------------------------------------------------------------------*}
procedure TClipConsoleForm.SetScreenCenter;
begin
  Left := (Screen.Width - Width) div 2;
  Top := (Screen.Height - Height) div 2;
end;

{*--------------------------------------------------------------------------*}
procedure TClipConsoleForm.FormCreate(Sender: TObject);
begin
  FCanClose := True;
  ResolveCommand;
  if FCanClose then Application.Terminate;
end;


{*--------------------------------------------------------------------------*}
// Commandline processes
{*--------------------------------------------------------------------------*}
procedure TClipConsoleForm.GetClip(const FileName: WideString);
var
  Clip: TUniClipboard;
begin
  FCanClose := True;
  Clip := TUniClipboard.Create;
  try
    SaveToFileAsUTF8(FileName, Clip.AsWideText);
  finally
    Clip.Free;
  end;
end;

{*--------------------------------------------------------------------------*}
procedure TClipConsoleForm.SetClip(const FileName: WideString);
var
  Clip: TUniClipboard;
begin
  FCanClose := True;
  Clip := TUniClipboard.Create;
  try
    Clip.AsWideText := LoadFromFileAsUTF8(FileName);
  finally
    Clip.Free;
  end;
end;


{*--------------------------------------------------------------------------*}
procedure TClipConsoleForm.ConsoleLog(const FileName: WideString);
begin
  FCanClose := False;
  ClipConsoleShell.Lines.Delimiter := #$0A;
  ClipConsoleShell.Lines.Text := LoadFromFileAsUTF8(FileName);

  SetScreenCenter;
  ClipConsoleForm.Visible := True;
  SetTopMostFocusWindow();
end;


{*--------------------------------------------------------------------------*}
procedure TClipConsoleForm.ResolveCommand;
var
  Command: String;
  FileName: WideString;
begin
  if ParamCount >= 2 then begin
    Command := LowerCase(ParamStr(1));
    FileName := ParamStr(2);

    if Pos('get', Command) > 0 then
    begin
      GetClip(FileName);
    end else if FileExists(FileName) then
    begin
      if Pos('log', Command) > 0 then
      begin
        ConsoleLog(FileName);
      end else if Pos('set', Command) > 0 then
      begin
        SetClip(FileName);
      end;
    end;
  end;
end;

end.
