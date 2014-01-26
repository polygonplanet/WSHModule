unit WSHModuleScript;

{$i WSHModule.inc}

interface

uses
  Windows,
  Messages,
  SysUtils,
  Classes,
  Graphics,
  Controls,
  Forms,
  Dialogs,
  StdCtrls;


type
  TProcedure = procedure of object;


type
  TScriptThread = class(TThread)
  private
    FOnExecute: TProcedure;
  protected
    procedure Execute; override;
  public
    property OnExecute: TProcedure read FOnExecute write FOnExecute;
  end;


type
  { -- TWSHModuleScript -- }
  TWSHModuleScript = class
  private
    FScriptThread: TScriptThread;
    FOnExecute: TProcedure;
    FOnTerminate: TProcedure;
    FStop: Boolean;
    FTerminated: Boolean;
    procedure OnScriptTerminate(Sender: TObject);
  public
    property ScriptThread: TScriptThread read FScriptThread write FScriptThread;
    property OnExecute: TProcedure read FOnExecute write FOnExecute;
    property OnTerminate: TProcedure read FOnTerminate write FOnTerminate;
    property Stop: Boolean read FStop write FStop;
    property Terminated: Boolean read FTerminated write FTerminated;
    constructor Create;
    procedure Execute;
    procedure Synchronize(Method: TThreadMethod);
  end;


implementation


{ -- TWSHModuleScript -- }
constructor TWSHModuleScript.Create;
begin
  inherited;
  FScriptThread := nil;
  FOnTerminate := nil;
  FOnExecute := nil;
  FTerminated := False;
  FStop := False;
end;


procedure TWSHModuleScript.OnScriptTerminate(Sender: TObject);
begin
  if not FTerminated and Assigned(FOnTerminate) then
  begin
    FTerminated := True;
    FOnTerminate;
    FOnTerminate := nil;
  end;
end;


procedure TWSHModuleScript.Execute;
begin
  if not Assigned(FScriptThread) then
  begin
    FScriptThread.Free;
    FScriptThread := TScriptThread.Create(False);
    FScriptThread.FreeOnTerminate := True;
    FScriptThread.OnTerminate := Self.OnScriptTerminate;
    FScriptThread.OnExecute := FOnExecute;
    FScriptThread.Start;
  end;
end;


procedure TWSHModuleScript.Synchronize(Method: TThreadMethod);
begin
  if Assigned(FScriptThread) then
  begin
    while not FScriptThread.Terminated do
    begin
      FScriptThread.Synchronize(Method);
      if FStop then
      begin
        FStop := False;
        Break;
      end;
      Sleep(30);
    end;
  end;
end;


{ -- TScriptThread -- }
procedure TScriptThread.Execute;
begin
  //inherited;
  if not Terminated and Assigned(FOnExecute) then
  begin
    FOnExecute;
    FOnExecute := nil;
  end;
end;


end.

