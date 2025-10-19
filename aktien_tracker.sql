--
-- PostgreSQL database dump
--

\restrict 5gBjFhyDL9oxzv5vvgoBkQ5SgGyK2PIc8QItecWtE9gQUCacr12VsGW5EbDFNxN

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: aktien; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aktien (
    id integer NOT NULL,
    depot_id integer,
    name character varying(100) NOT NULL,
    symbol character varying(20) NOT NULL,
    shares numeric(12,4) NOT NULL,
    buy_price numeric(12,2) NOT NULL,
    current_price numeric(12,2) NOT NULL,
    category character varying(20) DEFAULT 'Aktie'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_shares numeric(12,4) DEFAULT 0
);


ALTER TABLE public.aktien OWNER TO postgres;

--
-- Name: aktien_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aktien_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aktien_id_seq OWNER TO postgres;

--
-- Name: aktien_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aktien_id_seq OWNED BY public.aktien.id;


--
-- Name: depots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.depots (
    id integer NOT NULL,
    user_id integer,
    name character varying(100) NOT NULL,
    cash_bestand numeric(12,2) DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.depots OWNER TO postgres;

--
-- Name: depots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.depots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.depots_id_seq OWNER TO postgres;

--
-- Name: depots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.depots_id_seq OWNED BY public.depots.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    aktie_id integer,
    type character varying(10) NOT NULL,
    shares numeric(12,4) NOT NULL,
    price numeric(12,2) NOT NULL,
    transaction_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: aktien id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aktien ALTER COLUMN id SET DEFAULT nextval('public.aktien_id_seq'::regclass);


--
-- Name: depots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depots ALTER COLUMN id SET DEFAULT nextval('public.depots_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: aktien; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aktien (id, depot_id, name, symbol, shares, buy_price, current_price, category, created_at, current_shares) FROM stdin;
6	1	NVIDIA	NV	40.0000	100.00	89.00	Aktie	2025-10-19 17:36:37.616031	0.0000
5	1	Porsche	P911.DE	50.0000	40.00	45.00	Aktie	2025-10-19 17:36:13.464557	20.0000
\.


--
-- Data for Name: depots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.depots (id, user_id, name, cash_bestand, created_at) FROM stdin;
1	1	JustTrade	10000.00	2025-10-19 11:44:09.055101
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, aktie_id, type, shares, price, transaction_timestamp) FROM stdin;
9	5	BUY	50.0000	40.00	2025-10-13 12:02:00
10	6	BUY	40.0000	100.00	2025-10-01 17:00:00
11	6	SELL	30.0000	130.00	2025-10-08 12:12:00
12	6	SELL	10.0000	89.00	2025-10-17 13:02:00
13	5	SELL	30.0000	45.00	2025-10-15 17:17:00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, created_at) FROM stdin;
1	Kay	foell.kay@gmail.com	$2a$10$7PPeCSG92FkG/AWjme.V1.BCIcvtuNiUwsK9.npM344hjxuSZXFtC	2025-10-19 11:33:16.22415
\.


--
-- Name: aktien_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aktien_id_seq', 6, true);


--
-- Name: depots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.depots_id_seq', 1, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: aktien aktien_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aktien
    ADD CONSTRAINT aktien_pkey PRIMARY KEY (id);


--
-- Name: depots depots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depots
    ADD CONSTRAINT depots_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_aktien_depot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aktien_depot_id ON public.aktien USING btree (depot_id);


--
-- Name: idx_depots_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_depots_user_id ON public.depots USING btree (user_id);


--
-- Name: idx_transactions_aktie_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_aktie_id ON public.transactions USING btree (aktie_id);


--
-- Name: aktien aktien_depot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aktien
    ADD CONSTRAINT aktien_depot_id_fkey FOREIGN KEY (depot_id) REFERENCES public.depots(id) ON DELETE CASCADE;


--
-- Name: depots depots_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.depots
    ADD CONSTRAINT depots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_aktie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_aktie_id_fkey FOREIGN KEY (aktie_id) REFERENCES public.aktien(id) ON DELETE CASCADE;


--
-- Name: TABLE aktien; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.aktien TO aktien_user;


--
-- Name: SEQUENCE aktien_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.aktien_id_seq TO aktien_user;


--
-- Name: TABLE depots; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.depots TO aktien_user;


--
-- Name: SEQUENCE depots_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.depots_id_seq TO aktien_user;


--
-- Name: TABLE transactions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.transactions TO aktien_user;


--
-- Name: SEQUENCE transactions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.transactions_id_seq TO aktien_user;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO aktien_user;


--
-- Name: SEQUENCE users_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.users_id_seq TO aktien_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO aktien_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO aktien_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 5gBjFhyDL9oxzv5vvgoBkQ5SgGyK2PIc8QItecWtE9gQUCacr12VsGW5EbDFNxN

