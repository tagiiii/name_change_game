-- Supabaseデータベース設定用SQLファイル
-- 名前変えゲーム投票アプリ用テーブル作成

-- 1. rooms テーブル（ゲームルーム管理）
CREATE TABLE rooms (
  id VARCHAR(8) PRIMARY KEY,
  voting_active BOOLEAN DEFAULT FALSE,
  voting_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. changed_names テーブル（変更後の名前管理）
CREATE TABLE changed_names (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  changed_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. original_names テーブル（元の名前リスト）
CREATE TABLE original_names (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  original_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. votes テーブル（投票データ）
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(8) REFERENCES rooms(id) ON DELETE CASCADE,
  changed_name_id INTEGER REFERENCES changed_names(id) ON DELETE CASCADE,
  selected_original_name VARCHAR(100) NOT NULL,
  voter_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, changed_name_id, voter_id)
);

-- Row Level Security (RLS) の設定

-- rooms テーブル
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rooms" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);

-- changed_names テーブル
ALTER TABLE changed_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read changed_names" ON changed_names FOR SELECT USING (true);
CREATE POLICY "Anyone can insert changed_names" ON changed_names FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete changed_names" ON changed_names FOR DELETE USING (true);

-- original_names テーブル
ALTER TABLE original_names ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read original_names" ON original_names FOR SELECT USING (true);
CREATE POLICY "Anyone can insert original_names" ON original_names FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete original_names" ON original_names FOR DELETE USING (true);

-- votes テーブル
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON votes FOR INSERT WITH CHECK (true);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_changed_names_room_id ON changed_names(room_id);
CREATE INDEX idx_original_names_room_id ON original_names(room_id);
CREATE INDEX idx_votes_room_id ON votes(room_id);
CREATE INDEX idx_votes_changed_name_id ON votes(changed_name_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);

-- リアルタイム機能の有効化
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE changed_names;
ALTER PUBLICATION supabase_realtime ADD TABLE original_names;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;