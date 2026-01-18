alter table user_reasons drop column main_reason;
alter table user_reasons add column main_reason text[];