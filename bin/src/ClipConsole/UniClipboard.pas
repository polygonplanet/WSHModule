{ UniClipboard }

unit UniClipboard;


interface

uses
  Windows, Clipbrd;

type
  { -- TUniClipboard -- }
  TUniClipboard = class(TClipboard)
  private
    function GetAsWideText: WideString;
    procedure SetAsWideText(const Value: WideString);
  public
    property AsWideText: WideString read GetAsWideText write SetAsWideText;
    property AsText: WideString read GetAsWideText write SetAsWideText;
  end;


implementation


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
  Open;
  try
    inherited AsText := Value;
    SetBuffer(CF_UNICODETEXT, PWideChar(Value)^, (Length(Value) + 1) * SizeOf(WideChar));
  finally
    Close;
  end;
end;


end.

