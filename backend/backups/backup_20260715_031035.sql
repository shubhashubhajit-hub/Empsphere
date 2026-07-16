--
-- PostgreSQL database dump
--

\restrict XsZpcdrWWccK4YCE1fA86Iv3qIPbFsEbBhQas2kaZnYRn9lzqnVKnTykcw9Dze3

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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
-- Name: notificationtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notificationtype AS ENUM (
    'document_upload',
    'announcement',
    'system'
);


ALTER TYPE public.notificationtype OWNER TO postgres;

--
-- Name: otppurpose; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.otppurpose AS ENUM (
    'signup',
    'forgot_password'
);


ALTER TYPE public.otppurpose OWNER TO postgres;

--
-- Name: roleenum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.roleenum AS ENUM (
    'admin',
    'employee',
    'manager'
);


ALTER TYPE public.roleenum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id uuid NOT NULL,
    user_id uuid,
    action character varying NOT NULL,
    meta json,
    created_at timestamp without time zone
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    sender character varying NOT NULL,
    message text NOT NULL,
    referenced_documents json,
    created_at timestamp without time zone
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    title character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id uuid NOT NULL,
    title character varying NOT NULL,
    file_path character varying NOT NULL,
    file_type character varying NOT NULL,
    extracted_text text,
    is_ocr_processed boolean,
    category_id uuid,
    uploaded_by uuid NOT NULL,
    tags character varying,
    view_count integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    chat_message_id uuid,
    rating integer NOT NULL,
    comment text,
    created_at timestamp without time zone
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid NOT NULL,
    user_id uuid,
    title character varying NOT NULL,
    message text NOT NULL,
    type public.notificationtype,
    is_read boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: otp_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_verifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    otp_hash character varying NOT NULL,
    purpose public.otppurpose NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_used boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.otp_verifications OWNER TO postgres;

--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    id uuid NOT NULL,
    document_id uuid NOT NULL,
    questions json NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    password_hash character varying NOT NULL,
    role public.roleenum NOT NULL,
    is_blocked boolean,
    is_verified boolean,
    profile_picture character varying,
    theme character varying,
    language character varying,
    ai_model_pref character varying,
    created_at timestamp without time zone,
    last_login timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, action, meta, created_at) FROM stdin;
29d19b54-712d-417d-b23d-88539f651342	fb59c835-0be5-40cc-a8c9-6e2138f6bbf9	signup	{}	2026-07-11 03:18:30.375212
d53cca7c-0347-455b-9beb-4e9fe42d1a73	3ab07d96-cc1a-4205-8c71-556372ede1b7	signup	{}	2026-07-11 03:19:24.365642
64fef7c8-d87c-4bb4-a265-3dcc84ca1acc	3ab07d96-cc1a-4205-8c71-556372ede1b7	document_uploaded	{"title": "Shubhajit_Resume (1).docx", "ocr_used": false}	2026-07-11 03:24:04.70335
187180e9-b9ad-4360-a57d-048b26c4411f	3ab07d96-cc1a-4205-8c71-556372ede1b7	document_summarized	{"title": "Shubhajit_Resume (1).docx"}	2026-07-11 03:24:24.627632
86475176-fcbf-4a18-b8c7-9751b8985272	3ab07d96-cc1a-4205-8c71-556372ede1b7	quiz_generated	{"title": "Shubhajit_Resume (1).docx"}	2026-07-11 03:24:31.602123
c2506c93-2c24-4df1-952a-f049bd1ea39a	c0f9fb4d-0127-4c53-ab44-2f01c5a2d378	signup	{}	2026-07-11 10:59:14.213573
5aeebf95-59c7-4e43-9d53-e62c14a1dc43	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-11 11:02:37.979209
4e6d4827-8fe9-409a-9cc2-a154894ca681	8735f30e-1aec-479b-9b03-2f2852ad72d9	signup	{}	2026-07-11 11:19:12.677974
bd9a90b1-c30c-4f6a-8877-79ab472bc215	0dc5f501-3ae6-41b1-9fe3-affea07567fc	signup	{}	2026-07-11 11:28:38.009526
93d34728-9369-4c48-ba9f-0ce6d0f3275a	c228e7ea-efab-4a9c-93db-ce8e66e16d83	signup	{}	2026-07-11 11:43:26.546748
956b7487-9849-4699-ac3c-37c540e6c2ca	c228e7ea-efab-4a9c-93db-ce8e66e16d83	quiz_generated	{"title": "Shubhajit_Resume (1).docx"}	2026-07-11 11:44:45.999752
b72411ee-c991-4485-ac44-2777854aaddb	c4fd427d-c8ff-4184-a6fa-627eea0fc22a	signup	{}	2026-07-11 15:20:19.526433
33aef600-8f00-4c88-ae19-0f4bd1f266e7	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-12 00:03:02.323049
f30e6a8e-a79d-46c3-b632-e3d1b47f6e06	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-12 02:21:35.48366
f697cdc3-a465-4548-a73b-c3605dec4bbb	3ab07d96-cc1a-4205-8c71-556372ede1b7	document_viewed	{"title": "Shubhajit_Resume (1).docx"}	2026-07-12 02:21:48.546109
6f659bf6-0501-4e74-a9b9-0673461c3f17	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-13 10:36:56.742165
7f7469d3-cc54-4ed7-b049-517d8dd67e9a	24e92512-1d6a-425a-8365-8ab041e4af0f	signup	{}	2026-07-13 10:50:08.320351
03ff9e98-ac48-4730-9cf1-c1de809ee6c5	ee058cbb-091f-4ee0-992e-05ee278e4d9f	signup	{}	2026-07-13 11:02:23.248548
56550bd4-5c89-48cd-a68b-075438e823f1	729fb9d3-d917-4d73-8571-8f5695515a34	signup	{}	2026-07-13 11:09:00.74998
f0a2f938-9f37-4cd9-992f-2ebe940af7e3	729fb9d3-d917-4d73-8571-8f5695515a34	role_changed	{"target_user": "kumarsenapatiashok@gmail.com", "new_role": "admin"}	2026-07-13 11:10:24.624783
d50d73bb-74fe-4281-9149-11e4b780da6f	729fb9d3-d917-4d73-8571-8f5695515a34	role_changed	{"target_user": "kumarsenapatiashok@gmail.com", "new_role": "employee"}	2026-07-13 11:10:28.612428
862a60f2-8da8-4420-a644-fb6223e906a6	729fb9d3-d917-4d73-8571-8f5695515a34	role_changed	{"target_user": "kumarsenapatiashok@gmail.com", "new_role": "admin"}	2026-07-13 11:10:30.036156
0122c436-e6bb-401b-8be1-5d1084f8a9a8	729fb9d3-d917-4d73-8571-8f5695515a34	role_changed	{"target_user": "kumarsenapatiashok@gmail.com", "new_role": "employee"}	2026-07-13 11:10:30.803974
ae1e2e0c-511b-4cb4-9dad-688825b464e9	aa1d1928-0365-4b42-8c3d-0efa98603620	signup	{}	2026-07-14 01:52:51.646114
fe910d54-9e35-4b9f-80ad-f4a618abb83d	aa1d1928-0365-4b42-8c3d-0efa98603620	document_viewed	{"title": "Shubhajit_Resume (1).docx"}	2026-07-14 01:53:21.399014
cd4520bb-744a-4fe2-bb06-74dfd144fb68	aa1d1928-0365-4b42-8c3d-0efa98603620	document_uploaded	{"title": "quantum DPP 2.pdf", "ocr_used": false}	2026-07-14 01:55:28.35157
133100ad-7cdc-4ef1-ada6-185be7dcdf57	aa1d1928-0365-4b42-8c3d-0efa98603620	document_viewed	{"title": "quantum DPP 2.pdf"}	2026-07-14 01:55:31.335066
afe280b5-7edc-48ac-9084-98aa12bdb6e6	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-14 03:17:59.697779
e6ee1953-5735-44ce-b859-ae4e0d51aa82	3ab07d96-cc1a-4205-8c71-556372ede1b7	document_viewed	{"title": "quantum DPP 2.pdf"}	2026-07-14 03:36:37.097747
39023018-8e26-4652-b6a0-76456b14041b	ac1471c2-7189-41d7-a565-c5133d4a326b	signup	{}	2026-07-14 03:45:53.471038
84d60ec9-621b-4beb-b79a-ac37e0ab2572	ac1471c2-7189-41d7-a565-c5133d4a326b	document_viewed	{"title": "quantum DPP 2.pdf"}	2026-07-14 03:49:39.350294
cf2b228d-366a-4006-8013-7c605ee2ddd2	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-15 02:41:09.030349
9a3a7bc3-4629-4ebe-905f-7f4bf2289480	3ab07d96-cc1a-4205-8c71-556372ede1b7	login	{}	2026-07-15 02:46:14.641587
0d00c2dc-20f7-4f45-9f46-04663c35f2ea	d102fadb-efa9-4af9-9208-7d9ca9166d88	signup	{}	2026-07-15 03:07:39.416441
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name) FROM stdin;
eaf934c1-2da6-4745-9612-25ca5c92ffdd	HR
629e8303-f3be-4a47-932c-062fa4d07150	IT
bd3b5f86-4eec-41e8-b07f-3ad90a79d207	Finance
ecdd8649-6d94-4fa0-bfbe-defa30ee8914	Policies
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, session_id, sender, message, referenced_documents, created_at) FROM stdin;
f4b8ecd3-5ff0-4ac9-9184-8fb44e7a757b	7aa229c8-8651-4448-b1f0-65f67f2064f0	user	what is the policy of company	\N	2026-07-12 02:23:25.906658
86fe0185-103d-4b1a-892b-72adecda4b3f	7aa229c8-8651-4448-b1f0-65f67f2064f0	ai	I couldn't find anything relevant in the indexed documents for that question. Try rephrasing, or check that the right document has been uploaded.	[]	2026-07-12 02:23:25.90861
116380ec-e106-4ae7-a44e-cc2808ae655a	4691e55e-2344-4692-8baf-0213ad780889	user	give me quantum DPP	\N	2026-07-14 03:18:24.325069
5937203c-360f-4489-b757-cf6547737a86	4691e55e-2344-4692-8baf-0213ad780889	ai	No LLM API key is configured, so here's the best-matching excerpt found in "quantum DPP 2.pdf" (66.7% match):\n\nMatched by file name.	[{"document_id": "9ebafeb0-35e6-4761-a004-bb8f9f639f0f", "title": "quantum DPP 2.pdf", "snippet": "Matched by file name.", "confidence": 66.7}]	2026-07-14 03:18:24.32668
3f8ee6ae-899f-440e-933b-7570580222e4	fe2d33b2-32c0-4e0f-a8df-01db8b9972ab	user	give me Shubhajit_Resume	\N	2026-07-14 03:29:37.084517
613419f6-fe49-4aef-a76f-873e1e944d2c	fe2d33b2-32c0-4e0f-a8df-01db8b9972ab	ai	No LLM API key is configured, so here's the best-matching excerpt found in "Shubhajit_Resume (1).docx" (50.0% match):\n\nMatched by file name.	[{"document_id": "e9116948-c6be-4f54-8d13-329b891e892c", "title": "Shubhajit_Resume (1).docx", "snippet": "Matched by file name.", "confidence": 50.0}]	2026-07-14 03:29:37.087039
f1ebe518-0e97-478c-9abf-f34108f3e1cd	e2dd3fc0-1c00-40f9-aaa5-43c02d903624	user	give me quantum DPP	\N	2026-07-14 03:36:34.239125
455ecbba-3802-4fe1-ba60-0245049eab08	e2dd3fc0-1c00-40f9-aaa5-43c02d903624	ai	No LLM API key is configured, so here's the best-matching excerpt found in "quantum DPP 2.pdf" (66.7% match):\n\nMatched by file name.	[{"document_id": "9ebafeb0-35e6-4761-a004-bb8f9f639f0f", "title": "quantum DPP 2.pdf", "snippet": "Matched by file name.", "confidence": 66.7}]	2026-07-14 03:36:34.242261
10c0d9ba-da1b-4bde-b2d4-31349d74b3a5	ffdac06d-3c43-43e8-8453-a709d5fa4795	user	give me quantum DPP	\N	2026-07-14 03:49:34.043519
d338ea87-846c-4765-96d7-3bbce3075236	ffdac06d-3c43-43e8-8453-a709d5fa4795	ai	No LLM API key is configured, so here's the best-matching excerpt found in "quantum DPP 2.pdf" (66.7% match):\n\nMatched by file name.	[{"document_id": "9ebafeb0-35e6-4761-a004-bb8f9f639f0f", "title": "quantum DPP 2.pdf", "snippet": "Matched by file name.", "confidence": 66.7}]	2026-07-14 03:49:34.046233
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, user_id, title, created_at) FROM stdin;
7aa229c8-8651-4448-b1f0-65f67f2064f0	3ab07d96-cc1a-4205-8c71-556372ede1b7	what is the policy of company	2026-07-12 02:23:25.865133
4691e55e-2344-4692-8baf-0213ad780889	3ab07d96-cc1a-4205-8c71-556372ede1b7	give me quantum DPP	2026-07-14 03:18:24.281537
fe2d33b2-32c0-4e0f-a8df-01db8b9972ab	3ab07d96-cc1a-4205-8c71-556372ede1b7	give me Shubhajit_Resume	2026-07-14 03:29:37.063957
e2dd3fc0-1c00-40f9-aaa5-43c02d903624	3ab07d96-cc1a-4205-8c71-556372ede1b7	give me quantum DPP	2026-07-14 03:36:34.21253
ffdac06d-3c43-43e8-8453-a709d5fa4795	ac1471c2-7189-41d7-a565-c5133d4a326b	give me quantum DPP	2026-07-14 03:49:33.956306
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, file_path, file_type, extracted_text, is_ocr_processed, category_id, uploaded_by, tags, view_count, created_at, updated_at) FROM stdin;
e9116948-c6be-4f54-8d13-329b891e892c	Shubhajit_Resume (1).docx	./uploads\\54471c01-f579-407e-b1e6-fe7db5ee5788_Shubhajit_Resume (1).docx	docx	Shubhajit Kumar Senapati\nAspiring SAP ABAP Cloud Developer | Backend & Data-Driven Development\nshubhashubhajit@gmail.com | linkedin.com/in/shubhajit-kumar-senapati-747b5931b | Dhenkanal, Odisha\nProfessional Summary\nFinal year B.Tech Information Technology student, SAP Certified in Back-End Development with SAP ABAP Cloud, with a strong foundation in backend development, data structures, and problem-solving. Combines hands-on SAP ABAP Cloud training with full-stack development and applied AI/ML project experience, including a Retrieval-Augmented Generation (RAG) based enterprise knowledge assistant. Quick learner, comfortable with enterprise application architecture, and eager to build a career as an SAP ABAP Cloud consultant.\nEducation\nOdisha University of Technology and Research, Bhubaneswar\nB.Tech in Information Technology | CGPA: 8.3\nDhenkanal Higher Secondary School, Dhenkanal\nSenior Secondary Certificate (CHSE, Odisha) | Percentage: 88%\nBata Bihari Bidya Pitha, Tarava\nSecondary School Certificate (BSE, Odisha) | Percentage: 87.66%\nSAP Internship & Certification\nSAP Certified Back-End Developer — ABAP Cloud Internship\nSAP\nSAP Certified in Back-End Development using ABAP Cloud, completed through a structured SAP internship program.\nGained hands-on exposure to SAP's cloud-based ABAP development model, backend logic design, and enterprise application architecture within the SAP ecosystem.\nBuilt foundational understanding of SAP development standards and best practices, preparing for real-world SAP consulting and implementation projects.\nTechnical Skills\nSAP Technologies: SAP ABAP Cloud, SAP Backend Development (SAP Certified)\nLanguages: C, C++, Python, SQL, HTML, CSS\nDatabases: MySQL\nCore Competencies: Data Structures & Algorithms, Problem Solving, Software Documentation (IEEE SRS), UML Design\nAI/ML: Retrieval-Augmented Generation (RAG), LLM Integration, Vector Embeddings, ABAP Cloud\nTools & Platforms: Replit, Google Colab, VS Code\nTechnical Projects\nEmployee Management App — ABAP RAP (SAP BTP)\nIn Progress\t2026\nBuilding a full-stack SAP application using the ABAP RESTful Application Programming Model (RAP), modeling employee data through CDS Views on SAP BTP.\nImplementing a RAP Behavior Definition with CRUD operations and custom validation logic (e.g., unique employee ID checks) to enforce business rules at the service layer.\nExposing the CDS-based data model as an OData V4 service and consuming it through a Fiori Elements List Report / Object Page UI, with a custom action extending default CRUD behavior.\nEnterprise AI Knowledge Assistant (RAG)\nPersonal Project\t2026\nBuilt a Retrieval-Augmented Generation (RAG) based knowledge assistant to answer natural-language queries over enterprise documents using LLM-powered semantic search.\nDesigned the document ingestion and chunking pipeline with vector embeddings for fast, context-aware retrieval, reducing manual document lookup effort.\nIntegrated the retrieval pipeline with an LLM to generate accurate, source-grounded responses, improving answer relevance over keyword-based search.\nE-book Management System\nBhubaneswar, Odisha\nBuilt a full-stack E-book Management System using React 18, TypeScript, and Vite with role-based access for Student, Librarian, and Chief Librarian roles, supporting a catalog of 99+ books.\nImplemented automated fine calculation and approval workflows; executed 35 manual test cases achieving 100% pass rate; documented the project to IEEE SRS standards.	f	629e8303-f3be-4a47-932c-062fa4d07150	3ab07d96-cc1a-4205-8c71-556372ede1b7		2	2026-07-11 03:24:04.690504	2026-07-14 01:53:21.392358
9ebafeb0-35e6-4761-a004-bb8f9f639f0f	quantum DPP 2.pdf	./uploads\\bba991ea-162a-4e3d-8225-66d8de893d85_quantum DPP 2.pdf	pdf	\n\n\n\n	f	eaf934c1-2da6-4745-9612-25ca5c92ffdd	aa1d1928-0365-4b42-8c3d-0efa98603620		3	2026-07-14 01:55:28.338045	2026-07-14 03:49:39.344268
\.


--
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (id, user_id, chat_message_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, is_read, created_at) FROM stdin;
3ef12e9c-f88e-4419-9f1f-c58c895a1436	\N	New document uploaded	"Shubhajit_Resume (1).docx" was added by Shubhajit Kumar Senapati.	document_upload	t	2026-07-11 03:24:04.697265
7bda561d-063e-4732-bf1f-5f04fa837f41	\N	New document uploaded	"quantum DPP 2.pdf" was added by Jagannath Mishra.	document_upload	t	2026-07-14 01:55:28.346728
\.


--
-- Data for Name: otp_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.otp_verifications (id, user_id, otp_hash, purpose, expires_at, is_used, created_at) FROM stdin;
4f916b72-95c9-4efb-aa83-f439e76bf829	fb59c835-0be5-40cc-a8c9-6e2138f6bbf9	$2b$12$TF/SFGG3dUIfe.3ozFjOIe0kytUuQTlycjwadOLJNhHpr77lJs.9y	signup	2026-07-11 03:28:30.357826	f	2026-07-11 03:18:30.35906
dfa55d3c-1ebd-4721-b29a-064a7c370f88	3ab07d96-cc1a-4205-8c71-556372ede1b7	$2b$12$lQKqKIPsGGTbplwjdrvOH.UpcAPsxR1GXUIXLDocVInU1xerBZLw.	signup	2026-07-11 03:29:24.360131	t	2026-07-11 03:19:24.360543
544363ac-1516-4c80-800c-0132c0c10b96	c0f9fb4d-0127-4c53-ab44-2f01c5a2d378	$2b$12$yZK6xf62quFQsVlBy0QpyOiaIYrbVIygynjxfggH3vJwU0vUMSERu	signup	2026-07-11 11:09:14.196434	f	2026-07-11 10:59:14.197678
230c771d-76d9-43a1-ab3a-ea0155dea450	8735f30e-1aec-479b-9b03-2f2852ad72d9	$2b$12$uR/xGlg4zkSAB.Rk.kPHt.B/2aMAaKxRBMP7EnD5H4lDo3y9mhX0.	signup	2026-07-11 11:29:09.266724	f	2026-07-11 11:19:09.267976
4a181d05-065a-4d65-a4af-506de8338915	0dc5f501-3ae6-41b1-9fe3-affea07567fc	$2b$12$0ppsgrQCrpsRyFdC38GXseCfefQrs3SSG/0EBY4MHIGnIlOhQyRBK	signup	2026-07-11 11:38:34.421069	f	2026-07-11 11:28:34.422307
fb336e65-e533-4088-9923-eb8df8dd0cbc	c228e7ea-efab-4a9c-93db-ce8e66e16d83	$2b$12$gtqOXmolxDXJVcK282VJtOAWCny7hyPoGgmldzF6MvpLc5OMHwB5K	signup	2026-07-11 11:53:21.071181	t	2026-07-11 11:43:21.072638
af87489f-2478-4cd5-ae29-66db9cc45ed6	c4fd427d-c8ff-4184-a6fa-627eea0fc22a	$2b$12$xBr.dM4C0zmhJCYtlytFvuZDBRvLcOWDAio.Xhd/3b63SCZSFTLrO	signup	2026-07-11 15:30:14.234274	t	2026-07-11 15:20:14.23606
e0ad89db-4daf-4a02-8cd2-776addbb2046	24e92512-1d6a-425a-8365-8ab041e4af0f	$2b$12$90Q1djM8KDT9f/i53pqwqepUbPNixQ0TCRvqBkh9suHyyRJ.YX7mO	signup	2026-07-13 11:00:08.296148	f	2026-07-13 10:50:08.297995
83357a05-e8e8-4543-822c-10a0c3bdccc1	ee058cbb-091f-4ee0-992e-05ee278e4d9f	$2b$12$FeHd0ercRVNpbsSooKT5P.biX6m9Z1wBSaHVyI47jv3Jl1ALYiZ06	signup	2026-07-13 11:12:19.371021	t	2026-07-13 11:02:19.372317
2daf4006-fe53-4314-a81a-b47f1bfd54ef	729fb9d3-d917-4d73-8571-8f5695515a34	$2b$12$NPjm7kY7hbgITHds3Pnn5uFV.b0/4Oqz956ejBqPcX5EmdYMdsCeG	signup	2026-07-13 11:18:56.323844	t	2026-07-13 11:08:56.325992
858d2dd6-03a0-40f6-8013-78c98e871d93	aa1d1928-0365-4b42-8c3d-0efa98603620	$2b$12$6xPRbneHFyjx.JUTKplAeeDf4/pyXYrWSXT.0OMTwIQkOq7nVEa2S	signup	2026-07-14 02:02:46.639932	t	2026-07-14 01:52:46.641427
2f54e661-b282-439c-abfa-139a2c1ee60c	ac1471c2-7189-41d7-a565-c5133d4a326b	$2b$12$54ncH4IBZSRAEJN6j/jciujPHg9qD.rUHzbo/AQ9d.DK8iu2ATbCa	signup	2026-07-14 03:55:45.530437	t	2026-07-14 03:45:45.531705
ba5ed87c-bb6a-4e26-9937-b646e9e3e231	d102fadb-efa9-4af9-9208-7d9ca9166d88	$2b$12$zPECby7t3/iJHeoG/bDdruso3OdTuqnzH1HxcmLuPDCWCGRDqqFk2	signup	2026-07-15 03:17:34.34453	t	2026-07-15 03:07:34.345935
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quizzes (id, document_id, questions, created_at) FROM stdin;
5bcdb05f-810a-4317-bbac-442a58700bed	e9116948-c6be-4f54-8d13-329b891e892c	[{"question": "Fill in the blank: Implemented automated fine calculation and approval workflows; executed 35 manual test cases achieving 100% pass rate; documented the _____ to IEEE SRS standards.", "options": ["project", "accurate", "retrieval", "application"], "correct_answer": "project"}, {"question": "Fill in the blank: Built foundational understanding of SAP development standards and best _____ preparing for real-world SAP consulting and implementation projects.", "options": ["accurate", "practices", "achieving", "ingestion"], "correct_answer": "practices"}, {"question": "Fill in the blank: Gained hands-on exposure to SAP's cloud-based ABAP development model, backend logic design, and enterprise application architecture within the SAP _____", "options": ["unique", "consultant", "e.g", "ecosystem"], "correct_answer": "ecosystem"}, {"question": "Fill in the blank: Integrated the retrieval pipeline with an LLM to generate accurate, _____ responses, improving answer relevance over keyword-based search.", "options": ["source-grounded", "checks", "knowledge", "assistant"], "correct_answer": "source-grounded"}, {"question": "Fill in the blank: Combines hands-on SAP ABAP Cloud training with full-stack development and applied AI/ML _____ experience, including a Retrieval-Augmented Generation (RAG) based enterprise knowledge assistant.", "options": ["application", "projects", "context-aware", "project"], "correct_answer": "project"}]	2026-07-11 03:24:31.594885
541dc0a1-3667-4030-85a6-19eb7c9c770d	e9116948-c6be-4f54-8d13-329b891e892c	[{"question": "Fill in the blank: Combines hands-on SAP ABAP Cloud training with full-stack development and applied AI/ML project experience, including a Retrieval-Augmented Generation (RAG) based _____ knowledge assistant.", "options": ["unique", "enterprise", "standards", "architecture"], "correct_answer": "enterprise"}, {"question": "Fill in the blank: Quick learner, comfortable with enterprise _____ architecture, and eager to build a career as an SAP ABAP Cloud consultant.", "options": ["application", "lookup", "learner", "keyword-based"], "correct_answer": "application"}, {"question": "Fill in the blank: Built foundational understanding of SAP _____ standards and best practices, preparing for real-world SAP consulting and implementation projects.", "options": ["development", "service", "enforce", "career"], "correct_answer": "development"}, {"question": "Fill in the blank: Gained hands-on exposure to SAP's cloud-based ABAP development model, backend logic _____ and enterprise application architecture within the SAP ecosystem.", "options": ["design", "relevance", "effort", "generate"], "correct_answer": "design"}, {"question": "Fill in the blank: Integrated the retrieval pipeline with an LLM to generate _____ source-grounded responses, improving answer relevance over keyword-based search.", "options": ["accurate", "context-aware", "manual", "behavior"], "correct_answer": "accurate"}]	2026-07-11 11:44:45.985898
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, is_blocked, is_verified, profile_picture, theme, language, ai_model_pref, created_at, last_login) FROM stdin;
fb59c835-0be5-40cc-a8c9-6e2138f6bbf9	shubha	shubha@gmail.com	$2b$12$FnVnLv5kmE/oVq6lpQNqLOY/qCK/qS96CGbRevfkfxKrYATTozLCy	admin	f	f	\N	dark	en	auto	2026-07-11 03:18:29.974377	\N
c0f9fb4d-0127-4c53-ab44-2f01c5a2d378	sh	sh@gmail.com	$2b$12$wu83Df5xyjNsidbMgKkhCuTsmcJLB6Xs.OdKYLSQklC1R6yVDBN.W	employee	f	f	\N	dark	en	auto	2026-07-11 10:59:13.778679	\N
8735f30e-1aec-479b-9b03-2f2852ad72d9	shubhajit kumar	lulushubhajit2004@gmail.com	$2b$12$4Ic/uieGhVV/LUUISjq1A.UnWGWKC9x1u3WW197Nr2wgu4t/byx2i	employee	f	f	\N	dark	en	auto	2026-07-11 11:19:08.915806	\N
c228e7ea-efab-4a9c-93db-ce8e66e16d83	Swapan Subhankar	odiagkswapan@gmail.com	$2b$12$qRea42um6weyjb7SqxnzzOritFsSDhm/GJlYWMb.iyLFxdslSchUC	employee	f	t	./uploads\\avatar_a47f86bb-060c-4ccd-97cd-5d5f63fc03c4.jpeg	dark	en	auto	2026-07-11 11:43:20.663721	\N
c4fd427d-c8ff-4184-a6fa-627eea0fc22a	Ashok Kumar Senapati	ashokkumarsenapati887@gmail.com	$2b$12$MYyfYcwqPLiysAotRB4JU.3pbX9GnpEjU3JkeJ6SHh5rTqc7/UU76	employee	f	t	\N	dark	en	auto	2026-07-11 15:20:13.842369	\N
24e92512-1d6a-425a-8365-8ab041e4af0f	Snehajyoti Senapati	snehachinky50@gmail.com	$2b$12$gRlLia8cGTOJ0lW26MX2RO2dZTOv/D9WBGnf5BJGU98PPeg3c5rRm	manager	f	f	\N	dark	en	auto	2026-07-13 10:50:07.922056	\N
ee058cbb-091f-4ee0-992e-05ee278e4d9f	Miss Snehajyotiiii	snehajyoti880@gmail.com	$2b$12$WdqS.Etq9tq/Hn6YsApFMOUxG5n8oMqyxs0qzPzhXX8wiPkpQjI7W	manager	f	t	\N	dark	en	auto	2026-07-13 11:02:18.994297	\N
729fb9d3-d917-4d73-8571-8f5695515a34	Sneha	snehaodiagk@gmail.com	$2b$12$omGfyI44.roFzFIKcVxBWe2qrZ58AqC43THyFeSvS3tgfZS/vPxRa	admin	f	t	\N	dark	en	auto	2026-07-13 11:08:55.916996	\N
0dc5f501-3ae6-41b1-9fe3-affea07567fc	Ashok Kumar Senapati	kumarsenapatiashok@gmail.com	$2b$12$yN8BB63D3xRjA/F0NwZWYOlJiGzUEvuNjoXCMooxUKYW/.kR7K9hS	employee	f	f	\N	dark	en	auto	2026-07-11 11:28:34.075305	\N
aa1d1928-0365-4b42-8c3d-0efa98603620	Jagannath Mishra	jayjagannathgktutorial@gmail.com	$2b$12$is5NcrnQRwF8dgpgb7hmHO4YsSuT/yq1ZCNBkbRkjzsX872HCxrS.	manager	f	t	\N	dark	en	openai	2026-07-14 01:52:46.229234	\N
ac1471c2-7189-41d7-a565-c5133d4a326b	Siddhi Pradayaani Sahoo	siddhipradayanee@gmail.com	$2b$12$KiVDfW5c0koKl.dLgkJb5OkYzxSh9RaVAF7wZ6Kshsxy62w8y7fiO	manager	f	t	\N	dark	en	auto	2026-07-14 03:45:45.151396	\N
3ab07d96-cc1a-4205-8c71-556372ede1b7	Shubhajit Kumar Senapati	shubhashubhajit@gmail.com	$2b$12$RBfcT50spAvYEWXk4m6gZukNSTrjoqyY5ouqJeb1zk2l3.VJeBpBu	employee	f	t	\N	dark	en	auto	2026-07-11 03:19:24.012352	2026-07-15 02:46:14.598467
d102fadb-efa9-4af9-9208-7d9ca9166d88	SHUBHAJIT KUMAR SENAPATI	senapatishubha@gmail.com	$2b$12$YfmU95pWeHs8RMTKPI6Fqed4D26tjomCLzpRiG5jGN5jmP3R0RvMq	admin	f	t	\N	dark	en	auto	2026-07-15 03:07:33.975825	\N
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otp_verifications otp_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id);


--
-- Name: chat_sessions chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: documents documents_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: feedback feedback_chat_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_chat_message_id_fkey FOREIGN KEY (chat_message_id) REFERENCES public.chat_messages(id);


--
-- Name: feedback feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: otp_verifications otp_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_verifications
    ADD CONSTRAINT otp_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: quizzes quizzes_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- PostgreSQL database dump complete
--

\unrestrict XsZpcdrWWccK4YCE1fA86Iv3qIPbFsEbBhQas2kaZnYRn9lzqnVKnTykcw9Dze3

