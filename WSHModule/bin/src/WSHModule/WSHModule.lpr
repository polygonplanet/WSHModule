program WSHModule;

{$i WSHModule.inc}

uses
  Windows,
  Forms,
  Interfaces,
  WSHModuleConsole;

{$R *.res}

begin
  Application.Initialize;
  Application.CreateForm(TWSHModuleConsoleForm, WSHModuleConsoleForm);
  Application.ShowMainForm := False;
  Application.Run;
end.

