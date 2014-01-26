unit WSHModuleUtils;

{$i WSHModule.inc}

interface

uses
  Windows,
  InterfaceBase,
  win32int,
  Messages,
  SysUtils,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  StdCtrls,
  ComCtrls,
  ShellApi,
  Clipbrd,
  Menus,
  Math,
  LConvEncoding,
  lclproc;


type
  EUniClipboardError = class(Exception)
  public
    constructor Create;
  end;


  { -- TUniClipboard -- }
  TUniClipboard = class(TClipboard)
  private
    function GetAsWideText: WideString;
    procedure SetAsWideText(const Value: WideString);
    procedure SetAsFormat(ClipboardFormat: UINT; Buffer: Pointer; Count: Integer);
    function GetAsHTML: String;
    procedure SetAsHTML(HTML: String);
  public
    property AsWideText: WideString read GetAsWideText write SetAsWideText;
    property AsText: WideString read GetAsWideText write SetAsWideText;
    property AsHTML: String read GetAsHTML write SetAsHTML;
    class procedure Empty;
  end;


  { -- Utils -- }
  function WideStringToUTF8String(Src: WideString): UTF8String;
  function UTF8StringToWideString(Src: UTF8String): WideString;

  procedure SaveToFileAsUTF8(FileName: String; Data: UTF8String);
  function LoadFromFileAsUTF8(FileName: String): UTF8String;

  procedure Alert(Msg: String; Title: String = '');
  function Confirm(Msg: String; Title: String = ''): Boolean;

  procedure SetTopMostFocusWindow(Target: TForm; Visible: Boolean = True);
  procedure SetTaskbarVisible(Target: TForm; Visible: Boolean = True);
  procedure SetScreenCenter(Target: TForm);
  function GetRandomAlpha(Len: Integer): String;
  function GetRandomAlphanum(Len: Integer): String;
  function CreateUniqueFileName(Dir: String; Ext: String; Prefix: String = ''): String;
  function SilentDeleteFile(FileName: String): Boolean;
  function EscapeFileName(FileName: String): String;
  function GetTmpDir: String;
  function GetLongName(Path: String): String;


var
  CF_HTML: UINT; //TClipboardFormat;
  ClipbrdFmtHTML: UINT;


implementation


{ -- EUniClipboardError -- }
constructor EUniClipboardError.Create;
begin
  inherited Create('Could not complete clipboard operation.');
end;

{ -- TUniClipboard -- }
function TUniClipboard.GetAsWideText: WideString;
var
  Data: THandle;
begin
  Open;
  Data := GetClipboardData(CF_UNICODETEXT);
  try
    if Data <> 0 then
      Result := PWideChar(GlobalLock(Data))
    else
      Result := '';
  finally
    if Data <> 0 then
      GlobalUnlock(Data);
    Close;
  end;
  if (Data = 0) or (Result = '') then
    Result := inherited AsText
end;


procedure TUniClipboard.SetAsWideText(const Value: WideString);
begin
  SetAsFormat(CF_UNICODETEXT, PWideChar(Value), Length(Value));
end;


class procedure TUniClipboard.Empty;
begin
  OpenClipboard(TWin32WidgetSet(WidgetSet).AppHandle);
  try
    EmptyClipboard;
  finally
    CloseClipboard;
  end;
end;


procedure TUniClipboard.SetAsFormat(ClipboardFormat: UINT; Buffer: Pointer; Count: Integer);
var
  Handle: Windows.HGLOBAL;
  Ptr: Pointer;
begin
  if Count > 0 then
  begin
    OpenClipboard(TWin32WidgetSet(WidgetSet).AppHandle);
    try
      Handle := Windows.GlobalAlloc(GMEM_MOVEABLE, Count);
      try
        if Handle = 0 then
          raise EUniClipboardError.Create;

        Ptr := Windows.GlobalLock(Handle);

        if not Assigned(Ptr) then
          raise EUniClipboardError.Create;

        Move(Buffer^, Ptr^, Count);
        Windows.GlobalUnlock(Handle);

        EmptyClipboard;
        SetClipboardData(ClipboardFormat, Handle);
      except
        Windows.GlobalFree(Handle);
        raise;
      end;
    finally
      CloseClipboard;
    end;
  end;
end;


// http://wiki.freepascal.org/Clipboard#HTML_source
function TUniClipboard.GetAsHTML: String;
var
  S: WideString;
  MS: TMemoryStream;
begin
  MS := TMemoryStream.Create;
  try
    if Clipboard.GetFormat(ClipbrdFmtHTML, MS) then
    begin
      MS.Position := 0;
      SetString(S, PWideChar(MS.Memory), StrLen(PWideChar(MS.Memory)));
      Result := UTF8Encode(S);
    end;
  finally
    MS.Free;
  end;
end;


procedure TUniClipboard.SetAsHTML(HTML: String);
var
  S: WideString;
begin
  S := WideString(HTML);
  Clipboard.AddFormat(ClipbrdFmtHTML, S[1], (Length(S) + 1) * SizeOf(WideChar));
end;


// WideString <-> UTF8String conversion that supported Surrogate Pair
function WideStringToUTF8String(Src: WideString): UTF8String;
var
  Len: Integer;
  Buff: PAnsiChar;
begin
  Len  := WideCharToMultiByte(CP_UTF8, 0, PWideChar(Src), -1, nil, 0, nil, nil);
  Buff := AllocMem(Len + 1);
  try
    WideCharToMultiByte(CP_UTF8, 0, PWideChar(Src), -1, Buff, Len + 1, nil, nil);
    Result := UTF8String(Buff);
  finally
    FreeMem(Buff);
  end;
end;


function UTF8StringToWideString(Src: UTF8String): WideString;
var
  Len: Integer;
  Buff: PWideChar;
begin
  Result := '';
  Len := MultiByteToWideChar(CP_UTF8, 0, PAnsiChar(Src), -1, nil, 0);
  Buff := AllocMem((Len + 1) * 2);
  try
    MultiByteToWideChar(CP_UTF8, 0, PAnsiChar(Src), -1, Buff, Len);
    Result := WideString(Buff);
  finally
    FreeMem(Buff);
  end;
end;


procedure SaveToFileAsUTF8(FileName: String; Data: UTF8String);
var
  Stream: TFileStream;
begin
  Stream := TFileStream.Create(FileName, fmCreate);
  try
    Stream.WriteBuffer(Pointer(Data)^, Length(Data));
  finally
    Stream.Free;
  end;
end;


function LoadFromFileAsUTF8(FileName: String): UTF8String;
var
  Stream: TFileStream;
begin
  Result := '';
  Stream := TFileStream.Create(FileName, fmOpenRead);
  try
    SetLength(Result, Stream.Size);
    Stream.Position := 0;
    Stream.ReadBuffer(Pointer(Result)^, Stream.Size);
  finally
    Stream.Free;
  end;
end;


procedure Alert(Msg: String; Title: String = '');
begin
  if Length(Title) = 0 then
    Title := Application.Title;

  MessageBoxW(
    TWin32WidgetSet(WidgetSet).AppHandle,
    PWideChar(UTF8StringToWideString(Msg)),
    PWideChar(UTF8StringToWideString(Title)),
    MB_OK or MB_TOPMOST or MB_APPLMODAL or MB_SETFOREGROUND
  );
end;


function Confirm(Msg: String; Title: String = ''): Boolean;
begin
  if Length(Title) = 0 then
    Title := Application.Title;

  Result := MessageBoxW(
    TWin32WidgetSet(WidgetSet).AppHandle,
    PWideChar(UTF8StringToWideString(Msg)),
    PWideChar(UTF8StringToWideString(Title)),
    MB_OKCANCEL or MB_TOPMOST or MB_APPLMODAL or MB_SETFOREGROUND
  ) = IDOK;
end;


procedure SetTopMostFocusWindow(Target: TForm; Visible: Boolean = True);
begin
  if Visible then
  begin
    Target.Visible := True;
    SetForegroundWindow(Target.Handle);
    Target.SetFocus;
  end
  else
  begin
    Target.Visible := False;
  end;
end;


procedure SetTaskbarVisible(Target: TForm; Visible: Boolean = True);
begin
  if Target.Visible then
    Target.ShowInTaskBar := stDefault
  else
    Target.ShowInTaskBar := stNever;
end;


procedure SetScreenCenter(Target: TForm);
begin
  Target.Left := (Screen.Width - Target.Width) div 2;
  Target.Top := (Screen.Height - Target.Height) div 2;
end;


function GetRandomAlpha(Len: Integer): String;
const
  T = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
begin
  Randomize;
  Result := '';
  repeat
    Result := Result + T[Random(Length(T)) + 1];
  until (Length(Result) = Len);
end;


function GetRandomAlphanum(Len: Integer): String;
const
  T = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
begin
  Randomize;
  Result := '';
  repeat
    Result := Result + T[Random(Length(T)) + 1];
  until (Length(Result) = Len);
end;


function CreateUniqueFileName(Dir: String; Ext: String; Prefix: String = ''): String;
begin
  repeat
    Result := Format('%s%s%s.%s', [
      IncludeTrailingPathDelimiter(Dir),
      Prefix,
      GetRandomAlpha(8),
      Ext
    ]);
  until (not FileExists(Result));
end;


function SilentDeleteFile(FileName: String): Boolean;
begin
  Result := False;
  if FileExists(FileName) then
  begin
    try
      Result := DeleteFile(FileName);
    except
      on E: Exception do
      begin
        Result := False;
      end;
    end;
  end;
end;


function EscapeFileName(FileName: String): String;
begin
  Result := StringReplace(FileName, PathDelim, PathDelim + PathDelim, [rfReplaceAll]);
end;


function GetTmpDir: String;
var
  Len: Integer;
begin
  Len := GetTempPath(0, nil);
  if Len > 0 then
  begin
    SetLength(Result, Len);
    Len := GetTempPath(Len, PChar(Result));
    SetLength(Result, Len);
  end;
end;


function GetLongName(Path: String): String;

  function Check(S: String): String;
  var
    SR: TSearchRec;
  begin
    FindFirst(S, faAnyFile, SR);
    Result := SR.Name;
  end;

var
  P: Integer;
  Str, Res: String;
begin
  Res := '';
  P := Pos('\', Path);
  Str := Copy(Path, 1, P);
  Delete(Path, 1, P);
  Res := Str;

  repeat
    P := Pos('\', Path);
    if P > 0 then
    begin
      Str := Str + Copy(Path, 1, P - 1);
      Delete(Path, 1, P);
      Res := Res + Check(Str) + '\';
      Str := Str + '\';
    end
    else
    begin
      Str := Str + Path;
      Res := Res + Check(Str);
    end;
  until P <= 0;

  Result := Res;
end;


initialization
  ClipbrdFmtHTML := RegisterClipboardFormat('text/html');
  //CF_HTML := RegisterClipboardFormat('text/html');
  CF_HTML := Windows.RegisterClipboardFormat('HTML Format');

end.

