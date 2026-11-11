import tempfile
import unittest
from pathlib import Path
from save_reader.evidence import retain_pipe
from save_reader.voyages import VoyageHistory


class EvidenceChecks(unittest.TestCase):
    def test_cached_rates_are_not_replaced_by_a_newer_file_with_old_history(self):
        area={'cached':True,'stale':True,'received_at':'2026-11-09T10:00:00+00:00','game_timestamp':900}
        saved={'statistics_tick':1000}
        self.assertTrue(retain_pipe(area,saved,{'saved_at':'2026-11-09T11:00:00+00:00'},'waiting')[0])
        # Only explicitly comparable game clocks may arbitrate by tick.
        area['game_clock_domain']='simulation_ms';saved['statistics_clock_domain']='simulation_ms'
        self.assertFalse(retain_pipe(area,saved,{},'waiting')[0])
        area.update(cached=False,stale=False)
        self.assertEqual(retain_pipe(area,saved,{},'connected'),(True,'fresh_pipe'))
        self.assertEqual(retain_pipe(None,saved,{},'waiting'),(False,'saved_only'))

    def test_voyage_bounds_rollback_and_campaign_isolation(self):
        history=VoyageHistory()
        def sample(clock,target,context='A'):
            return {'campaign_fingerprint':context,'simulator_clock':{'GameTotal':clock},
                    'routes':[{'id':'route','stops':[{'station_id':1},{'station_id':2}]}],
                    'transport':{'ships':[{'meta_id':'ship','route_id':'route','target_station_id':target}]}}
        for clock,target in [(0,1),(60000,2),(120000,1)]:
            self.assertEqual(history.observe(sample(clock,target)),[])
        cycles=history.observe(sample(180000,2))
        self.assertEqual(len(cycles),1)
        self.assertEqual((cycles[0]['minimum_minutes'],cycles[0]['maximum_minutes']),(1,3))
        self.assertEqual(history.observe(sample(180000,2,'B')),[])
        self.assertEqual(history.observe(sample(100,1)),[])
        self.assertEqual(history.observe(sample(float('nan'),1)),[])
        self.assertEqual(history.observe(sample(True,1)),[])

    def test_release_source_manifest_excludes_operator_material_and_keeps_public_tools(self):
        from release_manifest import source_files,ROOT
        names={p.relative_to(ROOT).as_posix() for p in source_files()}
        self.assertIn('save_reader/progression.py',names)
        self.assertIn('tools/package_release.py',names)
        self.assertIn('test_release_028.cjs',names)
        self.assertFalse(any(n.startswith(('bridge-settings/','build/','releases/')) for n in names))
        self.assertFalse(any(n.endswith(('.jks','.a8s')) for n in names))

    def test_source_packaging_requires_explicit_public_docs_and_tools(self):
        from release_manifest import source_files
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            public = ('README.md', 'docs/SETUP.md', 'tools/package_release.py',
                      'android-probe/app/src/main/assets/dashboard/app.js')
            private = ('LOCAL_REVIEW.md', 'docs/WORK_PACKAGE_028.md', 'tools/probe_local.py',
                       '.ideas/scratch.md', 'android-probe/private-config.json')
            for name in public + private:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.touch()
            self.assertEqual({p.relative_to(root).as_posix() for p in source_files(root)}, set(public))

    def test_candidate_filename_is_accepted_by_existing_public_updater(self):
        from updater import select_release,RELEASES
        from version import APP_VERSION
        release={'tag_name':'v'+APP_VERSION,'assets':[{'name':'Anno117Companion.exe',
            'browser_download_url':RELEASES+'/download/v'+APP_VERSION+'/Anno117Companion.exe',
            'size':100,'digest':'sha256:'+'a'*64}]}
        result=select_release(release,current='0.21.5')
        self.assertEqual(result['status'],'available')
        self.assertEqual(result['asset']['name'],'Anno117Companion.exe')

    def test_native_report_rejects_invalid_common_read_model(self):
        from empire_report import build_empire_pdf
        with self.assertRaises(ValueError):
            build_empire_pdf({'readModel':{'schema':1,'sections':[{'title':'Bad','headers':['one'],'rows':[['two','three']]}]}})

    def test_optional_history_write_failure_does_not_destroy_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'file';path.write_text('not a directory')
            history=VoyageHistory(path/'history.json')
            self.assertEqual(history.observe({'campaign_fingerprint':'A','simulator_clock':{'GameTotal':0}}),[])


if __name__=='__main__':unittest.main()
