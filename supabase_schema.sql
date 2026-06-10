--
-- PostgreSQL database dump
--

\restrict Rmml7gtIbjG8c8nYFOLuWHlovtjo3fcdhfj9BaG7WAFQMT5ApwSarmNOSUqUbq7

-- Dumped from database version 18.4 (Homebrew)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Refresh_токены; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Refresh_токены" (
    id integer NOT NULL,
    "Идентификатор_пользователя" integer CONSTRAINT "Refresh_токены_Идентификатор_пол_not_null" NOT NULL,
    "Токен" text NOT NULL,
    "Истекает" timestamp without time zone NOT NULL,
    "Создан" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: Refresh_токены_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Refresh_токены_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Refresh_токены_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Refresh_токены_id_seq" OWNED BY public."Refresh_токены".id;


--
-- Name: Журнал_аудита; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Журнал_аудита" (
    "Идентификатор_лога" integer CONSTRAINT "Журнал_аудита_Идентификатор__not_null" NOT NULL,
    "Идентификатор_пользователя" integer,
    "Действие" character varying(50) NOT NULL,
    "Сущность" character varying(50) NOT NULL,
    "Старые_данные" jsonb,
    "Новые_данные" jsonb,
    "Дата_времени" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: Журнал_аудита_Идентификатор_лог_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Журнал_аудита" ALTER COLUMN "Идентификатор_лога" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Журнал_аудита_Идентификатор_лог_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Инциденты; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Инциденты" (
    "Идентификатор_инцидента" integer CONSTRAINT "Инциденты_Идентификатор_инци_not_null" NOT NULL,
    "Идентификатор_услуги" integer,
    "Идентификатор_сотрудника" integer,
    "Идентификатор_средства" integer,
    "Идентификатор_уязвимости" integer,
    "Дата_и_время_инцидента" timestamp without time zone CONSTRAINT "Инциденты_Дата_и_время_инциде_not_null" NOT NULL,
    "Тип_инцидента" character varying(50) NOT NULL,
    "Уровень_угрозы" integer,
    "Статус" character varying(20) DEFAULT 'Новый'::character varying,
    "Описание" text NOT NULL,
    "Дата_разрешения" timestamp without time zone,
    "Дата_создания" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "Дата_изменения" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Инциденты_Статус_check" CHECK ((("Статус")::text = ANY ((ARRAY['Новый'::character varying, 'В работе'::character varying, 'Закрыт'::character varying])::text[])))
);


--
-- Name: Инциденты_Идентификатор_инциде_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Инциденты" ALTER COLUMN "Идентификатор_инцидента" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Инциденты_Идентификатор_инциде_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Меры_реагирования; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Меры_реагирования" (
    "Идентификатор_меры" integer CONSTRAINT "Меры_реагирова_Идентификатор_not_null" NOT NULL,
    "Идентификатор_инцидента" integer CONSTRAINT "Меры_реагиров_Идентификатор_not_null1" NOT NULL,
    "Название_меры" character varying(100) CONSTRAINT "Меры_реагирова_Название_меры_not_null" NOT NULL,
    "Описание_меры" text,
    "Дата_выполнения" timestamp without time zone CONSTRAINT "Меры_реагирова_Дата_выполнен_not_null" NOT NULL,
    "Идентификатор_исполнителя" integer CONSTRAINT "Меры_реагиров_Идентификатор_not_null2" NOT NULL,
    "Результат" character varying(20),
    CONSTRAINT "Меры_реагирования_Результат_check" CHECK ((("Результат")::text = ANY ((ARRAY['Успешно'::character varying, 'Ошибка'::character varying, 'Ожидание'::character varying])::text[])))
);


--
-- Name: Меры_реагирован_Идентификатор_м_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Меры_реагирования" ALTER COLUMN "Идентификатор_меры" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Меры_реагирован_Идентификатор_м_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Пользователи; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Пользователи" (
    "Идентификатор_пользователя" integer CONSTRAINT "Пользователи_Идентификатор_п_not_null" NOT NULL,
    "Логин" character varying(50) NOT NULL,
    "Email" character varying(100) NOT NULL,
    "Хеш_пароля" character varying(255) NOT NULL,
    "Роль" character varying(20) DEFAULT 'operator'::character varying,
    "Активен" boolean DEFAULT true,
    "Идентификатор_сотрудника" integer,
    "Дата_создания" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "Дата_регистрации" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Пользователи_Роль_check" CHECK ((("Роль")::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying, 'viewer'::character varying])::text[])))
);


--
-- Name: Пользователи_Идентификатор_пол_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Пользователи" ALTER COLUMN "Идентификатор_пользователя" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Пользователи_Идентификатор_пол_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Сотрудники; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Сотрудники" (
    "Идентификатор_сотрудника" integer CONSTRAINT "Сотрудники_Идентификатор_сот_not_null" NOT NULL,
    "Фамилия" character varying(50) NOT NULL,
    "Имя" character varying(50) NOT NULL,
    "Отчество" character varying(50),
    "Должность" character varying(100) NOT NULL,
    "Подразделение" character varying(100) NOT NULL,
    "Email" character varying(100),
    "Телефон" character varying(20),
    "Активен" boolean DEFAULT true,
    "Фото" text
);


--
-- Name: Сотрудники_Идентификатор_сотру_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Сотрудники" ALTER COLUMN "Идентификатор_сотрудника" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Сотрудники_Идентификатор_сотру_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Средства_защиты; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Средства_защиты" (
    "Идентификатор_средства" integer CONSTRAINT "Средства_защит_Идентификатор_not_null" NOT NULL,
    "Название_средства" character varying(100) CONSTRAINT "Средства_защит_Название_сред_not_null" NOT NULL,
    "Тип_средства" character varying(50) NOT NULL,
    "Производитель" character varying(100),
    "Версия" character varying(50),
    "Дата_установки" date,
    "Статус" character varying(20) DEFAULT 'Активен'::character varying,
    "Описание" text,
    CONSTRAINT "Средства_защиты_Статус_check" CHECK ((("Статус")::text = ANY ((ARRAY['Активен'::character varying, 'Неактивен'::character varying])::text[])))
);


--
-- Name: Средства_защиты_Идентификатор_с_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Средства_защиты" ALTER COLUMN "Идентификатор_средства" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Средства_защиты_Идентификатор_с_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Услуги; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Услуги" (
    "Идентификатор_услуги" integer NOT NULL,
    "Название_услуги" character varying(100) NOT NULL,
    "Тип_услуги" character varying(50) NOT NULL,
    "Статус" character varying(20) NOT NULL,
    "Дата_создания" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "Дата_изменения" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Услуги_Статус_check" CHECK ((("Статус")::text = ANY ((ARRAY['Активен'::character varying, 'Неактивен'::character varying, 'На обслуживании'::character varying])::text[])))
);


--
-- Name: Услуги_Идентификатор_услуги_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Услуги" ALTER COLUMN "Идентификатор_услуги" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Услуги_Идентификатор_услуги_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Уязвимости; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Уязвимости" (
    "Идентификатор_уязвимости" integer CONSTRAINT "Уязвимости_Идентификатор_уяз_not_null" NOT NULL,
    "Идентификатор_средства" integer CONSTRAINT "Уязвимости_Идентификатор_сре_not_null" NOT NULL,
    "Тип_уязвимости" character varying(100) NOT NULL,
    "Описание" text,
    "Дата_обнаружения" date NOT NULL,
    "Уровень_критичности" integer,
    "Статус" character varying(20) DEFAULT 'Открыта'::character varying,
    "Дата_исправления" date,
    "Дата_изменения" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Уязвимости_Статус_check" CHECK ((("Статус")::text = ANY ((ARRAY['Открыта'::character varying, 'В работе'::character varying, 'Исправлена'::character varying])::text[]))),
    CONSTRAINT "Уязвимости_Уровень_критичност_check" CHECK ((("Уровень_критичности" >= 1) AND ("Уровень_критичности" <= 5)))
);


--
-- Name: Уязвимости_Идентификатор_уязви_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public."Уязвимости" ALTER COLUMN "Идентификатор_уязвимости" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."Уязвимости_Идентификатор_уязви_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Refresh_токены id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refresh_токены" ALTER COLUMN id SET DEFAULT nextval('public."Refresh_токены_id_seq"'::regclass);


--
-- Name: Refresh_токены Refresh_токены_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refresh_токены"
    ADD CONSTRAINT "Refresh_токены_pkey" PRIMARY KEY (id);


--
-- Name: Refresh_токены Refresh_токены_Токен_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refresh_токены"
    ADD CONSTRAINT "Refresh_токены_Токен_key" UNIQUE ("Токен");


--
-- Name: Журнал_аудита Журнал_аудита_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Журнал_аудита"
    ADD CONSTRAINT "Журнал_аудита_pkey" PRIMARY KEY ("Идентификатор_лога");


--
-- Name: Инциденты Инциденты_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Инциденты"
    ADD CONSTRAINT "Инциденты_pkey" PRIMARY KEY ("Идентификатор_инцидента");


--
-- Name: Меры_реагирования Меры_реагирования_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Меры_реагирования"
    ADD CONSTRAINT "Меры_реагирования_pkey" PRIMARY KEY ("Идентификатор_меры");


--
-- Name: Пользователи Пользователи_Email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Пользователи"
    ADD CONSTRAINT "Пользователи_Email_key" UNIQUE ("Email");


--
-- Name: Пользователи Пользователи_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Пользователи"
    ADD CONSTRAINT "Пользователи_pkey" PRIMARY KEY ("Идентификатор_пользователя");


--
-- Name: Пользователи Пользователи_Логин_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Пользователи"
    ADD CONSTRAINT "Пользователи_Логин_key" UNIQUE ("Логин");


--
-- Name: Сотрудники Сотрудники_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Сотрудники"
    ADD CONSTRAINT "Сотрудники_pkey" PRIMARY KEY ("Идентификатор_сотрудника");


--
-- Name: Средства_защиты Средства_защиты_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Средства_защиты"
    ADD CONSTRAINT "Средства_защиты_pkey" PRIMARY KEY ("Идентификатор_средства");


--
-- Name: Услуги Услуги_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Услуги"
    ADD CONSTRAINT "Услуги_pkey" PRIMARY KEY ("Идентификатор_услуги");


--
-- Name: Уязвимости Уязвимости_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Уязвимости"
    ADD CONSTRAINT "Уязвимости_pkey" PRIMARY KEY ("Идентификатор_уязвимости");


--
-- Name: idx_refresh_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_token ON public."Refresh_токены" USING btree ("Токен");


--
-- Name: Refresh_токены Refresh_токены_Идентификатор_польз_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refresh_токены"
    ADD CONSTRAINT "Refresh_токены_Идентификатор_польз_fkey" FOREIGN KEY ("Идентификатор_пользователя") REFERENCES public."Пользователи"("Идентификатор_пользователя") ON DELETE CASCADE;


--
-- Name: Инциденты Инциденты_Идентификатор_сотруд_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Инциденты"
    ADD CONSTRAINT "Инциденты_Идентификатор_сотруд_fkey" FOREIGN KEY ("Идентификатор_сотрудника") REFERENCES public."Сотрудники"("Идентификатор_сотрудника");


--
-- Name: Инциденты Инциденты_Идентификатор_средст_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Инциденты"
    ADD CONSTRAINT "Инциденты_Идентификатор_средст_fkey" FOREIGN KEY ("Идентификатор_средства") REFERENCES public."Средства_защиты"("Идентификатор_средства");


--
-- Name: Инциденты Инциденты_Идентификатор_услуги_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Инциденты"
    ADD CONSTRAINT "Инциденты_Идентификатор_услуги_fkey" FOREIGN KEY ("Идентификатор_услуги") REFERENCES public."Услуги"("Идентификатор_услуги");


--
-- Name: Инциденты Инциденты_Идентификатор_уязвим_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Инциденты"
    ADD CONSTRAINT "Инциденты_Идентификатор_уязвим_fkey" FOREIGN KEY ("Идентификатор_уязвимости") REFERENCES public."Уязвимости"("Идентификатор_уязвимости");


--
-- Name: Меры_реагирования Меры_реагирова_Идентификатор__fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Меры_реагирования"
    ADD CONSTRAINT "Меры_реагирова_Идентификатор__fkey1" FOREIGN KEY ("Идентификатор_исполнителя") REFERENCES public."Сотрудники"("Идентификатор_сотрудника");


--
-- Name: Меры_реагирования Меры_реагирован_Идентификатор__fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Меры_реагирования"
    ADD CONSTRAINT "Меры_реагирован_Идентификатор__fkey" FOREIGN KEY ("Идентификатор_инцидента") REFERENCES public."Инциденты"("Идентификатор_инцидента") ON DELETE CASCADE;


--
-- Name: Пользователи Пользователи_Идентификатор_сот_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Пользователи"
    ADD CONSTRAINT "Пользователи_Идентификатор_сот_fkey" FOREIGN KEY ("Идентификатор_сотрудника") REFERENCES public."Сотрудники"("Идентификатор_сотрудника") ON DELETE SET NULL;


--
-- Name: Уязвимости Уязвимости_Идентификатор_средс_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Уязвимости"
    ADD CONSTRAINT "Уязвимости_Идентификатор_средс_fkey" FOREIGN KEY ("Идентификатор_средства") REFERENCES public."Средства_защиты"("Идентификатор_средства") ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Rmml7gtIbjG8c8nYFOLuWHlovtjo3fcdhfj9BaG7WAFQMT5ApwSarmNOSUqUbq7

