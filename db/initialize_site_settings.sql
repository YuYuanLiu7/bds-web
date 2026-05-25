-- Create site_settings table for storing website-wide configuration dynamically
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default visual settings matching bds.fu-notes.com
INSERT INTO site_settings (key, value)
VALUES (
  'homepage',
  '{
    "primaryColor": "#21448e",
    "logoUrl": "https://s.teachifycdn.com/image/width=400,quality=80/school/logo/a0285805-c7b3-48c3-bd43-24c2909be4e2/9c048f8f-d7d1-4091-9ea6-aa921655102a.png",
    "slogan": "業務不是超人，卻有超能力！",
    "carouselSlides": [
      { "id": "1", "imageUrl": "https://warehouse.kaik.network/school/images/1a375793-d194-4c52-a000-ec9f8a59f2f2.jpg", "link": "/courses" },
      { "id": "2", "imageUrl": "https://warehouse.kaik.network/school/images/22713f2b-fc91-4c0c-ab4c-9a3097656001.png", "link": "/courses" },
      { "id": "3", "imageUrl": "https://warehouse.kaik.network/school/images/ec48d188-e0b5-4496-8810-26ddfc4b0038.png", "link": "/courses" }
    ],
    "sectionImage1": {
      "imageUrl": "https://warehouse.kaik.network/school/images/800c43d7-815d-4b73-8347-0f76477826f0.jpg",
      "link": "/courses"
    },
    "sectionImage2": {
      "imageUrl": "https://warehouse.kaik.network/school/images/5b9a03dd-e0b5-4108-926e-0e0ba29afab3.jpg",
      "link": "/courses"
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;
