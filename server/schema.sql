--
-- PostgreSQL database dump
--

\restrict GnaA5HwnjT9NuopGmnRZtvTPElZUDvpTtCewEoaO74wkSrnigvr90msMLE0ONcq

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: application_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.application_skills (
    application_id integer NOT NULL,
    skill_id integer NOT NULL,
    importance text NOT NULL,
    CONSTRAINT application_skills_importance_values CHECK ((importance = ANY (ARRAY['required'::text, 'nice_to_have'::text])))
);


--
-- Name: applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.applications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    recruiter text,
    source_website text,
    status text DEFAULT 'saved'::text NOT NULL,
    applied_on date,
    extraction_status text DEFAULT 'not_attempted'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    job_description text,
    jd_extraction jsonb,
    CONSTRAINT extraction_status_values CHECK ((extraction_status = ANY (ARRAY['not_attempted'::text, 'success'::text, 'failed'::text]))),
    CONSTRAINT status_values CHECK ((status = ANY (ARRAY['saved'::text, 'applied'::text, 'interview'::text, 'offer'::text, 'rejected'::text])))
);


--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: cv_evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cv_evaluations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    cv_id integer,
    cv_file_name text NOT NULL,
    tier text NOT NULL,
    application_count integer NOT NULL,
    skill_gap jsonb NOT NULL,
    evaluation jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cv_evaluations_tier_values CHECK ((tier = ANY (ARRAY['none'::text, 'limited'::text, 'full'::text])))
);


--
-- Name: cv_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cv_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cv_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cv_evaluations_id_seq OWNED BY public.cv_evaluations.id;


--
-- Name: cv_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cv_skills (
    cv_id integer NOT NULL,
    skill_id integer NOT NULL
);


--
-- Name: cvs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cvs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    file_name text NOT NULL,
    mime_type text NOT NULL,
    size_bytes integer NOT NULL,
    file_data bytea NOT NULL,
    extracted_text text,
    text_extraction_status text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    skills_extraction jsonb,
    skills_extraction_status text DEFAULT 'not_attempted'::text NOT NULL,
    CONSTRAINT cvs_mime_type_values CHECK ((mime_type = ANY (ARRAY['application/pdf'::text, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'::text, 'text/plain'::text]))),
    CONSTRAINT cvs_skills_extraction_status_values CHECK ((skills_extraction_status = ANY (ARRAY['not_attempted'::text, 'success'::text, 'failed'::text]))),
    CONSTRAINT cvs_text_extraction_status_values CHECK ((text_extraction_status = ANY (ARRAY['success'::text, 'failed'::text])))
);


--
-- Name: cvs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cvs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cvs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cvs_id_seq OWNED BY public.cvs.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.skills (
    id integer NOT NULL,
    key text NOT NULL,
    canonical_name text NOT NULL
);


--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_history (
    id integer NOT NULL,
    application_id integer NOT NULL,
    status text NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT status_history_status_values CHECK ((status = ANY (ARRAY['saved'::text, 'applied'::text, 'interview'::text, 'offer'::text, 'rejected'::text])))
);


--
-- Name: status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_history_id_seq OWNED BY public.status_history.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT username_shape CHECK ((username ~ '^[A-Za-z0-9_]{3,30}$'::text))
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: cv_evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_evaluations ALTER COLUMN id SET DEFAULT nextval('public.cv_evaluations_id_seq'::regclass);


--
-- Name: cvs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cvs ALTER COLUMN id SET DEFAULT nextval('public.cvs_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history ALTER COLUMN id SET DEFAULT nextval('public.status_history_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: application_skills application_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_skills
    ADD CONSTRAINT application_skills_pkey PRIMARY KEY (application_id, skill_id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: cv_evaluations cv_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_evaluations
    ADD CONSTRAINT cv_evaluations_pkey PRIMARY KEY (id);


--
-- Name: cv_skills cv_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_skills
    ADD CONSTRAINT cv_skills_pkey PRIMARY KEY (cv_id, skill_id);


--
-- Name: cvs cvs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cvs
    ADD CONSTRAINT cvs_pkey PRIMARY KEY (id);


--
-- Name: skills skills_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_key_unique UNIQUE (key);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: status_history status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: application_skills_skill_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX application_skills_skill_id_idx ON public.application_skills USING btree (skill_id);


--
-- Name: applications_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX applications_user_id_idx ON public.applications USING btree (user_id);


--
-- Name: cv_evaluations_user_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cv_evaluations_user_created_idx ON public.cv_evaluations USING btree (user_id, created_at DESC);


--
-- Name: cv_skills_skill_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cv_skills_skill_id_idx ON public.cv_skills USING btree (skill_id);


--
-- Name: cvs_one_primary_per_user; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cvs_one_primary_per_user ON public.cvs USING btree (user_id) WHERE is_primary;


--
-- Name: cvs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cvs_user_id_idx ON public.cvs USING btree (user_id);


--
-- Name: status_history_application_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX status_history_application_id_idx ON public.status_history USING btree (application_id);


--
-- Name: users_email_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_lower_idx ON public.users USING btree (lower(email));


--
-- Name: users_username_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_username_lower_idx ON public.users USING btree (lower(username));


--
-- Name: application_skills application_skills_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_skills
    ADD CONSTRAINT application_skills_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- Name: application_skills application_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.application_skills
    ADD CONSTRAINT application_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: applications applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cv_evaluations cv_evaluations_cv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_evaluations
    ADD CONSTRAINT cv_evaluations_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id) ON DELETE SET NULL;


--
-- Name: cv_evaluations cv_evaluations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_evaluations
    ADD CONSTRAINT cv_evaluations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cv_skills cv_skills_cv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_skills
    ADD CONSTRAINT cv_skills_cv_id_fkey FOREIGN KEY (cv_id) REFERENCES public.cvs(id) ON DELETE CASCADE;


--
-- Name: cv_skills cv_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cv_skills
    ADD CONSTRAINT cv_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id);


--
-- Name: cvs cvs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cvs
    ADD CONSTRAINT cvs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: status_history status_history_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_history
    ADD CONSTRAINT status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict GnaA5HwnjT9NuopGmnRZtvTPElZUDvpTtCewEoaO74wkSrnigvr90msMLE0ONcq

