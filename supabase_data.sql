--
-- PostgreSQL database dump
--

\restrict TUwcm67exQLdMjRSm7qHYtIVQR5aYborF54ODEV27LrjfTU0gVSe46Rdwgy4XTW

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

--
-- Data for Name: Журнал_аудита; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Журнал_аудита" ("Идентификатор_лога", "Идентификатор_пользователя", "Действие", "Сущность", "Старые_данные", "Новые_данные", "Дата_времени") FROM stdin;
1	5	Создание записи в "Инциденты"	Инциденты	{}	{"Описание": "Проверка автологирования", "Тип_инцидента": "Тест аудита", "Уровень_угрозы": 2}	2026-06-10 18:29:11.995347
2	5	Создание записи в "Инциденты"	Инциденты	{}	{"Описание": "Проверка ТЗ", "Тип_инцидента": "Финальный тест", "Уровень_угрозы": 3}	2026-06-10 18:49:57.059705
\.


--
-- Data for Name: Сотрудники; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Сотрудники" ("Идентификатор_сотрудника", "Фамилия", "Имя", "Отчество", "Должность", "Подразделение", "Email", "Телефон", "Активен", "Фото") FROM stdin;
1	Сапегина	Варвара	Руслановна	Аналитик ИБ	Отдел безопасности	sapegina@company.ru	+79001234567	t	\N
2	Иванов	Петр	Сергеевич	Системный администратор	IT-отдел	ivanov@company.ru	+79007654321	t	\N
3	Петрова	Анна	Владимировна	Руководитель отдела	Отдел безопасности	petrova@company.ru	+79009876543	t	\N
\.


--
-- Data for Name: Средства_защиты; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Средства_защиты" ("Идентификатор_средства", "Название_средства", "Тип_средства", "Производитель", "Версия", "Дата_установки", "Статус", "Описание") FROM stdin;
1	Kaspersky Endpoint Security	Антивирус	Kaspersky Lab	12.0	2025-01-15	Активен	Корпоративный антивирус
2	Cisco ASA Firewall	Межсетевой экран	Cisco	9.14	2024-11-20	Активен	Аппаратный фаервол
3	Solar Dozor	DLP-система	Ростелеком-Солар	4.5	2025-03-10	Активен	Система предотвращения утечек
4	PostgreSQL	СУБД	PostgreSQL Global	15.2	2024-09-01	Активен	Основная база данных
\.


--
-- Data for Name: Услуги; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Услуги" ("Идентификатор_услуги", "Название_услуги", "Тип_услуги", "Статус", "Дата_создания", "Дата_изменения") FROM stdin;
1	Личный кабинет клиента	Веб-сервис	Активен	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
2	Платежный шлюз	API-сервис	Активен	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
3	Корпоративная почта	Веб-сервис	Активен	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
4	Облачное хранилище	Облачный сервис	На обслуживании	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
\.


--
-- Data for Name: Уязвимости; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Уязвимости" ("Идентификатор_уязвимости", "Идентификатор_средства", "Тип_уязвимости", "Описание", "Дата_обнаружения", "Уровень_критичности", "Статус", "Дата_исправления", "Дата_изменения") FROM stdin;
1	1	CVE-2025-1234	Уязвимость в движке сканирования	2025-05-01	4	Открыта	\N	2026-06-09 22:31:50.872311
2	2	CVE-2025-5678	Ошибка конфигурации правил	2025-04-15	3	В работе	\N	2026-06-09 22:31:50.872311
3	4	CVE-2025-9012	SQL-инъекция в хранимой процедуре	2025-06-01	5	Открыта	\N	2026-06-09 22:31:50.872311
4	1	Устаревшая версия	Требуется обновление до версии 12.5	2025-03-20	2	Исправлена	\N	2026-06-09 22:31:50.872311
\.


--
-- Data for Name: Инциденты; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Инциденты" ("Идентификатор_инцидента", "Идентификатор_услуги", "Идентификатор_сотрудника", "Идентификатор_средства", "Идентификатор_уязвимости", "Дата_и_время_инцидента", "Тип_инцидента", "Уровень_угрозы", "Статус", "Описание", "Дата_разрешения", "Дата_создания", "Дата_изменения") FROM stdin;
1	1	1	1	1	2025-06-05 10:30:00	Обнаружение вредоносного ПО	4	В работе	Обнаружен троян на рабочей станции	\N	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
2	2	2	2	2	2025-06-06 14:15:00	Попытка несанкционированного доступа	3	Новый	Множественные попытки входа с неизвестного IP	\N	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
3	3	1	3	\N	2025-06-07 09:00:00	Утечка данных	5	Новый	Попытка отправки конфиденциальных документов на внешний email	\N	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
4	1	3	4	3	2025-06-08 16:45:00	SQL-инъекция	5	Новый	Обнаружена попытка SQL-инъекции в веб-форме	\N	2026-06-09 22:31:50.872311	2026-06-09 22:31:50.872311
7	\N	\N	\N	\N	2026-06-10 18:29:11.993236	Тест аудита	2	Новый	Проверка автологирования	\N	2026-06-10 18:29:11.993236	2026-06-10 18:29:11.993236
8	\N	\N	\N	\N	2026-06-10 18:49:57.056953	Финальный тест	3	Новый	Проверка ТЗ	\N	2026-06-10 18:49:57.056953	2026-06-10 18:49:57.056953
\.


--
-- Data for Name: Меры_реагирования; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Меры_реагирования" ("Идентификатор_меры", "Идентификатор_инцидента", "Название_меры", "Описание_меры", "Дата_выполнения", "Идентификатор_исполнителя", "Результат") FROM stdin;
1	1	Изоляция зараженного узла	Отключение компьютера от сети	2025-06-05 11:00:00	2	Успешно
2	1	Полная проверка системы	Запуск полного сканирования антивирусом	2025-06-05 12:00:00	1	Успешно
3	2	Блокировка IP-адреса	Добавление IP в черный список фаервола	2025-06-06 14:30:00	2	Успешно
\.


--
-- Data for Name: Пользователи; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Пользователи" ("Идентификатор_пользователя", "Логин", "Email", "Хеш_пароля", "Роль", "Активен", "Идентификатор_сотрудника", "Дата_создания", "Дата_регистрации") FROM stdin;
2	sapegina	sapegina@company.ru	$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	operator	t	1	2026-06-09 22:31:50.872311	2026-06-10 13:38:24.488014
3	ivanov	ivanov@company.ru	$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy	viewer	t	2	2026-06-09 22:31:50.872311	2026-06-10 13:38:24.488014
4	testuser	test@test.ru	$2b$10$moxDvnpY6ISEdggSLxfnieiVahYdnRm7MzIwCmYSQ3kSGSGxkCgCu	operator	t	\N	2026-06-09 22:48:40.505883	2026-06-10 13:38:24.488014
5	admin	admin@security.local	$2b$10$sKQjTQ5Kihnf.IwtvbCgk.7LZjwYul2oPUJpfl6coyYp24OnX.vP.	admin	t	\N	2026-06-10 00:17:25.402549	2026-06-10 13:38:24.488014
6	varvara	sapegina_varya@mail.ru	$2b$10$c1QH.oxL4GGTGhlSx/ksnega.dIEGyOJ1HKZ76pBAie2x2lpz9n7K	viewer	t	\N	2026-06-10 13:08:27.157673	2026-06-10 13:38:24.488014
\.


--
-- Name: Refresh_токены_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Refresh_токены_id_seq"', 11, true);


--
-- Name: Журнал_аудита_Идентификатор_лог_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Журнал_аудита_Идентификатор_лог_seq"', 2, true);


--
-- Name: Инциденты_Идентификатор_инциде_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Инциденты_Идентификатор_инциде_seq"', 8, true);


--
-- Name: Меры_реагирован_Идентификатор_м_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Меры_реагирован_Идентификатор_м_seq"', 3, true);


--
-- Name: Пользователи_Идентификатор_пол_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Пользователи_Идентификатор_пол_seq"', 6, true);


--
-- Name: Сотрудники_Идентификатор_сотру_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Сотрудники_Идентификатор_сотру_seq"', 3, true);


--
-- Name: Средства_защиты_Идентификатор_с_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Средства_защиты_Идентификатор_с_seq"', 4, true);


--
-- Name: Услуги_Идентификатор_услуги_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Услуги_Идентификатор_услуги_seq"', 4, true);


--
-- Name: Уязвимости_Идентификатор_уязви_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Уязвимости_Идентификатор_уязви_seq"', 4, true);


--
-- PostgreSQL database dump complete
--

\unrestrict TUwcm67exQLdMjRSm7qHYtIVQR5aYborF54ODEV27LrjfTU0gVSe46Rdwgy4XTW

