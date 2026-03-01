drop view if exists "private"."indy_entry_candidates";

drop view if exists "private"."available_indy_hours";

drop view if exists "private"."current_special_indy";


create table "private"."teachers" (
  "tid" text not null,
  "created_at" timestamp with time zone not null default now(),
  "firstname" text not null,
  "lastname" text not null
    );


alter table "private"."teachers" enable row level security;

alter table "private"."booking_data" alter column "hour" set data type smallint using "hour"::smallint;

alter table "private"."special_indy" alter column "hour" set data type smallint using "hour"::smallint;

CREATE UNIQUE INDEX teachers_pkey ON private.teachers USING btree (tid);

alter table "private"."teachers" add constraint "teachers_pkey" PRIMARY KEY using index "teachers_pkey";

alter table "private"."booking_data" add constraint "booking_data_teacher_fkey" FOREIGN KEY (teacher) REFERENCES private.teachers(tid) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "private"."booking_data" validate constraint "booking_data_teacher_fkey";

create or replace view "private"."current_special_indy" as  SELECT id,
    created_at,
    teacher,
    day,
    hour,
    start_date,
    end_date
   FROM private.special_indy s
  WHERE (((CURRENT_DATE + 1) >= start_date) AND ((CURRENT_DATE + 1) <= end_date));


create or replace view "private"."available_indy_hours" as  SELECT h.created_at,
    h.day,
    h.hour,
    h.room,
    h.teacher,
    h.fullname,
    h.consultation,
    h.slimit,
    h.area_of_expertise,
    h.id
   FROM (private.hours h
     LEFT JOIN private.current_special_indy s ON (((h.teacher = s.teacher) AND (h.day = s.day) AND (h.hour = s.hour))))
  WHERE (s.id IS NULL);


create or replace view "private"."indy_entry_candidates" as  SELECT b.id,
    b.created_at,
    b.teacher,
    b.day,
    b.hour,
    b.subject,
    b.user_id,
    b.activity,
    b.priority
   FROM (private.booking_data b
     JOIN private.available_indy_hours a ON (((b.day = a.day) AND (b.hour = a.hour) AND (b.teacher = a.teacher))));



