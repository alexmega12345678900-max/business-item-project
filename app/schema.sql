create table if not exists events (
  id integer primary key autoincrement,
  ts integer not null,
  uid text,
  src text,
  ev text not null,
  kind text
);
create index if not exists events_ev on events(ev);
create index if not exists events_src on events(src);
