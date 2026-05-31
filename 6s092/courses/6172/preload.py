def get_pset_paths():
    pset = sorted(csm_loader.get_subdirs(globals(), cs_course, ['PS']))
    pset_paths = [['PS'] + [x] for x in pset]
    return pset_paths

cs_base_color = "#4286f4"
cs_header = '6.s092 Code'
cs_icon_url = 'COURSE/favicon_local.gif'
cs_long_name = cs_content_header = "Performance Engineering of Software Systems"
cs_title = '6.172 Performance Engineering'
